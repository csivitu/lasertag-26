/**
 * A "registration" is a booking, joined to the user who made it. There is no
 * registrations table — see packages/database/schema.ts.
 */

import { randomBytes } from "node:crypto";

import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from "../errors";
import {
  findSlotById,
  countActiveBookingsForSlot,
  findUserById,
  findActiveRegistrationForUser,
  createSoloRegistration as dbCreateSoloRegistration,
  findRegistrationWithUserAndSlot,
  confirmRegistration as dbConfirmRegistration,
  cancelRegistration as dbCancelRegistration,
  findRegistrationForScan,
  markUserCheckedIn,
} from "../data/queries";

// ==========================================
// Types
// ==========================================

export type RegistrationFilters = {
  reg_no?: string;
  name?: string;
  phone?: string;
  email?: string;
};

/** The flat shape returned by the bookings -> user join. */
export type RegistrationRow = {
  regNo: string;
  type: "individual" | "team";
  teamCode: string | null;
  slotId: string;
  confirmationEmailSent: boolean;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  paid: boolean;
  isCheckedIn: boolean;
  checkedInAt: Date | null;
};

export type RegistrationDto = {
  regNo: string;
  type: "individual" | "team";
  teamCode: string | null;
  slotId: string;
  confirmationEmailSent: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    paid: boolean;
    isCheckedIn: boolean;
    checkedInAt: Date | null;
  };
};

export interface RegistrationsDeps {
  search(filters: RegistrationFilters): Promise<RegistrationRow[]>;
}

/** Minimal shape the service needs to decide ownership / admin access. */
export type RequesterUser = { id: string; role: string };

// ==========================================
// Pure helpers
// ==========================================

/** Pure: flattened join row -> the nested shape the API returns. */
export function toRegistrationDto(row: RegistrationRow): RegistrationDto {
  return {
    regNo: row.regNo,
    type: row.type,
    teamCode: row.teamCode,
    slotId: row.slotId,
    confirmationEmailSent: row.confirmationEmailSent,
    user: {
      id: row.userId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      paid: row.paid,
      isCheckedIn: row.isCheckedIn,
      checkedInAt: row.checkedInAt,
    },
  };
}

function generateRegistrationId(): string {
  return `REG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateQrToken(): string {
  return randomBytes(32).toString("hex");
}

function isOwnerOrAdmin(bookingUserId: string, requester: RequesterUser): boolean {
  return requester.id === bookingUserId || requester.role === "admin";
}

// ==========================================
// Admin list (existing)
// ==========================================

export function makeRegistrationsService(deps: RegistrationsDeps) {
  return {
    async list(filters: RegistrationFilters): Promise<RegistrationDto[]> {
      const rows = await deps.search(filters);
      return rows.map(toRegistrationDto);
    },
  };
}

export type RegistrationsService = ReturnType<typeof makeRegistrationsService>;

// ==========================================
// Participant-facing registration service
// ==========================================

export const registrationService = {
  /**
   * POST /registrations/solo
   *
   * Rules:
   * - Slot must exist
   * - Slot must not be full (cancelled bookings do not count against capacity)
   * - User must exist
   * - User must not already have an active (non-cancelled) registration
   * - Registration ID is generated in the service
   * - New registration starts with status = "reserved"
   */
  async createSoloRegistration(userId: string, slotId: string) {
    const slot = await findSlotById(slotId);
    if (!slot) {
      throw new NotFoundError("Slot not found");
    }

    const activeCount = await countActiveBookingsForSlot(slotId);
    if (activeCount >= slot.capacity) {
      throw new ConflictError("Slot is full");
    }

    const foundUser = await findUserById(userId);
    if (!foundUser) {
      throw new NotFoundError("User not found");
    }

    const existingRegistration = await findActiveRegistrationForUser(userId);
    if (existingRegistration) {
      throw new ConflictError("User already has an active registration", {
        existing_registration_id: existingRegistration.id,
      });
    }

    const registrationId = generateRegistrationId();

    const booking = await dbCreateSoloRegistration({
      id: registrationId,
      userId,
      slotId,
    });

    return booking;
  },

  /**
   * GET /registrations/:reservation_id
   *
   * Rules:
   * - Registration must exist
   * - Only owner or admin can view
   */
  async getRegistration(registrationId: string, requester: RequesterUser) {
    const result = await findRegistrationWithUserAndSlot(registrationId);
    if (!result) {
      throw new NotFoundError("Registration not found");
    }

    if (!isOwnerOrAdmin(result.booking.userId, requester)) {
      throw new ForbiddenError("You do not have access to this registration");
    }

    return {
      booking: result.booking,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phNumber,
        paid: result.user.paid,
        isCheckedIn: result.user.isCheckedIn,
        checkedInAt: result.user.checkedInAt,
      },
      slot: {
        id: result.slot.id,
        startTime: result.slot.startTime,
        endTime: result.slot.endTime,
        capacity: result.slot.capacity,
      },
    };
  },

  /**
   * POST /registrations/:reservation_id/confirm
   *
   * Rules:
   * - Registration must exist
   * - Cancelled registrations cannot be confirmed
   * - Already confirmed registrations should not generate a new QR token
   * - QR token is generated during confirmation (unique/random)
   * - confirmedAt is set during confirmation
   */
  async confirmRegistration(registrationId: string) {
    const result = await findRegistrationWithUserAndSlot(registrationId);
    if (!result) {
      throw new NotFoundError("Registration not found");
    }

    if (result.booking.status === "cancelled") {
      throw new ConflictError("Cannot confirm a cancelled registration");
    }

    if (result.booking.status === "confirmed") {
      // Already confirmed — return existing data without generating a new QR
      return {
        booking: result.booking,
        alreadyConfirmed: true,
      };
    }

    const qrToken = generateQrToken();
    const updated = await dbConfirmRegistration(registrationId, qrToken);

    return {
      booking: updated,
      alreadyConfirmed: false,
    };
  },

  /**
   * DELETE /registrations/:reservation_id
   *
   * Rules:
   * - Registration must exist
   * - Only owner or admin can cancel
   * - cancelledAt is set during cancellation
   * - Soft delete: sets status = "cancelled" instead of hard delete
   */
  async cancelRegistration(registrationId: string, requester: RequesterUser) {
    const result = await findRegistrationWithUserAndSlot(registrationId);
    if (!result) {
      throw new NotFoundError("Registration not found");
    }

    if (!isOwnerOrAdmin(result.booking.userId, requester)) {
      throw new ForbiddenError("You do not have access to cancel this registration");
    }

    if (result.booking.status === "cancelled") {
      throw new ConflictError("Registration is already cancelled");
    }

    if (result.user.isCheckedIn) {
      throw new ConflictError(
        "Cannot cancel registration for a user who has already checked in",
      );
    }

    const updated = await dbCancelRegistration(registrationId);

    return { booking: updated };
  },

  /**
   * GET /registrations/:reservation_id/qr
   *
   * Rules:
   * - Registration must exist
   * - Only owner or admin can get QR
   * - Confirmed registrations can return QR
   * - Cancelled registrations cannot return QR
   * - Reserved (unconfirmed) registrations have no QR yet
   */
  async getRegistrationQr(registrationId: string, requester: RequesterUser) {
    const result = await findRegistrationWithUserAndSlot(registrationId);
    if (!result) {
      throw new NotFoundError("Registration not found");
    }

    if (!isOwnerOrAdmin(result.booking.userId, requester)) {
      throw new ForbiddenError("You do not have access to this registration's QR");
    }

    if (result.booking.status === "cancelled") {
      throw new ConflictError("Cannot retrieve QR for a cancelled registration");
    }

    if (result.booking.status === "reserved" || !result.booking.qrToken) {
      throw new ValidationError(
        "Registration has not been confirmed yet. Confirm before retrieving QR.",
      );
    }

    return {
      registrationId: result.booking.id,
      qrToken: result.booking.qrToken,
      user: {
        id: result.user.id,
        name: result.user.name,
      },
      slot: {
        id: result.slot.id,
        startTime: result.slot.startTime,
        endTime: result.slot.endTime,
      },
    };
  },

  /**
   * Scan a QR token or registration ID to look up and check in.
   *
   * Rules:
   * - Looks up by bookings.qrToken OR bookings.id
   * - Check-in requires confirmed registration
   * - Check-in rejects cancelled registration
   * - Check-in may require paid user
   * - Already checked-in user returns { alreadyCheckedIn: true }
   * - checkedInAt is set during check-in
   */
  async scanRegistration(identifier: string) {
    const result = await findRegistrationForScan(identifier);
    if (!result) {
      throw new NotFoundError("Registration not found for the given QR or ID");
    }

    if (result.booking.status === "cancelled") {
      throw new ConflictError("This registration has been cancelled");
    }

    if (result.booking.status !== "confirmed") {
      throw new ValidationError("Registration must be confirmed before check-in");
    }

    if (!result.user.paid) {
      throw new ValidationError("User has not completed payment");
    }

    if (result.user.isCheckedIn) {
      return {
        alreadyCheckedIn: true,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          checkedInAt: result.user.checkedInAt,
        },
        booking: result.booking,
        slot: result.slot,
      };
    }

    const updatedUser = await markUserCheckedIn(result.user.id);

    return {
      alreadyCheckedIn: false,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        checkedInAt: updatedUser.checkedInAt,
      },
      booking: result.booking,
      slot: result.slot,
    };
  },
};
