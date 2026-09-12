import { beforeEach, describe, expect, mock, test } from "bun:test";

import {
  makeRegistrationsService,
  toRegistrationDto,
  registrationService,
  type RegistrationRow,
  type RegistrationsDeps,
} from "./registrations";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from "../errors";
import * as queries from "../data/queries";

type QueryMock<T extends (...args: never[]) => unknown> = T & {
  mockReset(): void;
  mockResolvedValueOnce(value: unknown): QueryMock<T>;
  mockImplementationOnce(fn: T): QueryMock<T>;
};

mock.module("../data/queries", () => ({
  findSlotById: mock(),
  countActiveBookingsForSlot: mock(),
  findUserById: mock(),
  findActiveRegistrationForUser: mock(),
  createSoloRegistration: mock(),
  findRegistrationWithUserAndSlot: mock(),
  confirmRegistration: mock(),
  cancelRegistration: mock(),
  findRegistrationForScan: mock(),
  markUserCheckedIn: mock(),
}));

const findSlotByIdMock = queries.findSlotById as QueryMock<typeof queries.findSlotById>;
const countActiveBookingsForSlotMock = queries.countActiveBookingsForSlot as QueryMock<
  typeof queries.countActiveBookingsForSlot
>;
const findUserByIdMock = queries.findUserById as QueryMock<typeof queries.findUserById>;
const findActiveRegistrationForUserMock =
  queries.findActiveRegistrationForUser as QueryMock<
    typeof queries.findActiveRegistrationForUser
  >;
const createSoloRegistrationMock = queries.createSoloRegistration as QueryMock<
  typeof queries.createSoloRegistration
>;
const findRegistrationWithUserAndSlotMock =
  queries.findRegistrationWithUserAndSlot as QueryMock<
    typeof queries.findRegistrationWithUserAndSlot
  >;
const confirmRegistrationMock = queries.confirmRegistration as QueryMock<
  typeof queries.confirmRegistration
>;
const cancelRegistrationMock = queries.cancelRegistration as QueryMock<
  typeof queries.cancelRegistration
>;
const findRegistrationForScanMock = queries.findRegistrationForScan as QueryMock<
  typeof queries.findRegistrationForScan
>;
const markUserCheckedInMock = queries.markUserCheckedIn as QueryMock<
  typeof queries.markUserCheckedIn
>;

const queryMocks = [
  findSlotByIdMock,
  countActiveBookingsForSlotMock,
  findUserByIdMock,
  findActiveRegistrationForUserMock,
  createSoloRegistrationMock,
  findRegistrationWithUserAndSlotMock,
  confirmRegistrationMock,
  cancelRegistrationMock,
  findRegistrationForScanMock,
  markUserCheckedInMock,
];

const mockSlot = {
  id: "slot-uuid-1",
  startTime: new Date("2026-10-01T10:00:00Z"),
  endTime: new Date("2026-10-01T11:00:00Z"),
  capacity: 10,
};

const mockUser = {
  id: "user-123",
  name: "John Doe",
  email: "john@example.com",
  phNumber: "1234567890",
  paid: true,
  isCheckedIn: false,
  checkedInAt: null,
  role: "user",
};

const mockOwnerRequester = { id: "user-123", role: "user" };
const mockAdminRequester = { id: "admin-999", role: "admin" };
const mockStrangerRequester = { id: "user-456", role: "user" };

const mockReservedBooking = {
  id: "REG-1001",
  type: "individual" as const,
  status: "reserved" as const,
  userId: "user-123",
  slotId: "slot-uuid-1",
  teamCode: null,
  qrToken: null,
  confirmedAt: null,
  cancelledAt: null,
  confirmationEmailSent: false,
  createdAt: new Date(),
};

const mockConfirmedBooking = {
  ...mockReservedBooking,
  status: "confirmed" as const,
  qrToken: "abc123qrtokenhex",
  confirmedAt: new Date("2026-09-12T05:00:00Z"),
  cancelledAt: null,
};

const mockCancelledBooking = {
  ...mockReservedBooking,
  status: "cancelled" as const,
  cancelledAt: new Date("2026-09-12T05:10:00Z"),
};

beforeEach(() => {
  for (const queryMock of queryMocks) {
    queryMock.mockReset();
  }
});

const row: RegistrationRow = {
  regNo: "reg-2026-0001",
  type: "individual",
  teamCode: null,
  slotId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  confirmationEmailSent: true,
  userId: "user-1",
  name: "Alicia Rao",
  email: "alicia@example.com",
  phone: "9876543210",
  paid: true,
  isCheckedIn: false,
  checkedInAt: null,
};

describe("toRegistrationDto", () => {
  test("nests the flat join row under user", () => {
    expect(toRegistrationDto(row)).toEqual({
      regNo: "reg-2026-0001",
      type: "individual",
      teamCode: null,
      slotId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      confirmationEmailSent: true,
      user: {
        id: "user-1",
        name: "Alicia Rao",
        email: "alicia@example.com",
        phone: "9876543210",
        paid: true,
        isCheckedIn: false,
        checkedInAt: null,
      },
    });
  });

  test("preserves a null teamCode", () => {
    expect(toRegistrationDto(row).teamCode).toBeNull();
  });
});

describe("makeRegistrationsService", () => {
  test("list maps every row returned by search", async () => {
    const search = mock(async () => [row, { ...row, regNo: "reg-2026-0002" }]);
    const deps: RegistrationsDeps = { search };
    const service = makeRegistrationsService(deps);

    const result = await service.list({ name: "Alicia" });

    expect(search).toHaveBeenCalledWith({ name: "Alicia" });
    expect(result).toHaveLength(2);
    expect(result[1]?.regNo).toBe("reg-2026-0002");
  });
});

describe("registrationService.createSoloRegistration", () => {
  test("createSoloRegistration: slot not found", async () => {
    findSlotByIdMock.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.createSoloRegistration("user-123", "slot-uuid-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("createSoloRegistration: user not found", async () => {
    findSlotByIdMock.mockResolvedValueOnce(mockSlot);
    countActiveBookingsForSlotMock.mockResolvedValueOnce(2);
    findUserByIdMock.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.createSoloRegistration("user-123", "slot-uuid-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("createSoloRegistration: slot full", async () => {
    findSlotByIdMock.mockResolvedValueOnce(mockSlot);
    countActiveBookingsForSlotMock.mockResolvedValueOnce(10); // capacity = 10

    await expect(
      registrationService.createSoloRegistration("user-123", "slot-uuid-1"),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("createSoloRegistration: cancelled bookings do not count toward slot capacity", async () => {
    findSlotByIdMock.mockResolvedValueOnce(mockSlot);
    countActiveBookingsForSlotMock.mockResolvedValueOnce(5); // 5 active, slot capacity 10
    findUserByIdMock.mockResolvedValueOnce(mockUser);
    findActiveRegistrationForUserMock.mockResolvedValueOnce(undefined);
    createSoloRegistrationMock.mockResolvedValueOnce(mockReservedBooking);

    const result = await registrationService.createSoloRegistration("user-123", "slot-uuid-1");
    expect(result).toEqual(mockReservedBooking);
  });

  test("createSoloRegistration: duplicate reserved booking rejected", async () => {
    findSlotByIdMock.mockResolvedValueOnce(mockSlot);
    countActiveBookingsForSlotMock.mockResolvedValueOnce(2);
    findUserByIdMock.mockResolvedValueOnce(mockUser);
    findActiveRegistrationForUserMock.mockResolvedValueOnce(mockReservedBooking);

    await expect(
      registrationService.createSoloRegistration("user-123", "slot-uuid-1"),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("createSoloRegistration: duplicate confirmed booking rejected", async () => {
    findSlotByIdMock.mockResolvedValueOnce(mockSlot);
    countActiveBookingsForSlotMock.mockResolvedValueOnce(2);
    findUserByIdMock.mockResolvedValueOnce(mockUser);
    findActiveRegistrationForUserMock.mockResolvedValueOnce(mockConfirmedBooking);

    await expect(
      registrationService.createSoloRegistration("user-123", "slot-uuid-1"),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("createSoloRegistration: user with only cancelled registrations can register again", async () => {
    findSlotByIdMock.mockResolvedValueOnce(mockSlot);
    countActiveBookingsForSlotMock.mockResolvedValueOnce(0);
    findUserByIdMock.mockResolvedValueOnce(mockUser);
    findActiveRegistrationForUserMock.mockResolvedValueOnce(undefined);
    createSoloRegistrationMock.mockResolvedValueOnce(mockReservedBooking);

    const result = await registrationService.createSoloRegistration("user-123", "slot-uuid-1");
    expect(result).toEqual(mockReservedBooking);
  });

  test("createSoloRegistration: creates booking with status = \"reserved\"", async () => {
    findSlotByIdMock.mockResolvedValueOnce(mockSlot);
    countActiveBookingsForSlotMock.mockResolvedValueOnce(0);
    findUserByIdMock.mockResolvedValueOnce(mockUser);
    findActiveRegistrationForUserMock.mockResolvedValueOnce(undefined);
    createSoloRegistrationMock.mockResolvedValueOnce(mockReservedBooking);

    const result = await registrationService.createSoloRegistration("user-123", "slot-uuid-1");
    expect(result.status).toBe("reserved");
  });

  test("createSoloRegistration: creates booking with qrToken = null", async () => {
    findSlotByIdMock.mockResolvedValueOnce(mockSlot);
    countActiveBookingsForSlotMock.mockResolvedValueOnce(0);
    findUserByIdMock.mockResolvedValueOnce(mockUser);
    findActiveRegistrationForUserMock.mockResolvedValueOnce(undefined);
    createSoloRegistrationMock.mockResolvedValueOnce(mockReservedBooking);

    const result = await registrationService.createSoloRegistration("user-123", "slot-uuid-1");
    expect(result.qrToken).toBeNull();
  });

  test("createSoloRegistration: creates booking with confirmedAt = null", async () => {
    findSlotByIdMock.mockResolvedValueOnce(mockSlot);
    countActiveBookingsForSlotMock.mockResolvedValueOnce(0);
    findUserByIdMock.mockResolvedValueOnce(mockUser);
    findActiveRegistrationForUserMock.mockResolvedValueOnce(undefined);
    createSoloRegistrationMock.mockResolvedValueOnce(mockReservedBooking);

    const result = await registrationService.createSoloRegistration("user-123", "slot-uuid-1");
    expect(result.confirmedAt).toBeNull();
  });

  test("createSoloRegistration: creates booking with cancelledAt = null", async () => {
    findSlotByIdMock.mockResolvedValueOnce(mockSlot);
    countActiveBookingsForSlotMock.mockResolvedValueOnce(0);
    findUserByIdMock.mockResolvedValueOnce(mockUser);
    findActiveRegistrationForUserMock.mockResolvedValueOnce(undefined);
    createSoloRegistrationMock.mockResolvedValueOnce(mockReservedBooking);

    const result = await registrationService.createSoloRegistration("user-123", "slot-uuid-1");
    expect(result.cancelledAt).toBeNull();
  });
});

describe("registrationService.confirmRegistration", () => {
  test("confirmRegistration: booking not found", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.confirmRegistration("missing-id"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("confirmRegistration: cancelled booking cannot be confirmed", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockCancelledBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.confirmRegistration("REG-1001"),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("confirmRegistration: reserved booking can be confirmed", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    confirmRegistrationMock.mockResolvedValueOnce(mockConfirmedBooking);

    const result = await registrationService.confirmRegistration("REG-1001");
    expect(result.alreadyConfirmed).toBe(false);
    expect(result.booking.status).toBe("confirmed");
  });

  test("confirmRegistration: already confirmed registration is idempotent", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.confirmRegistration("REG-1001");
    expect(result.alreadyConfirmed).toBe(true);
    expect(result.booking).toEqual(mockConfirmedBooking);
  });

  test("confirmRegistration: generates QR token on first confirmation", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    confirmRegistrationMock.mockImplementationOnce(async (_id: string, token: string) => ({
      ...mockConfirmedBooking,
      qrToken: token,
    }));

    const result = await registrationService.confirmRegistration("REG-1001");
    expect(result.booking.qrToken).toBeDefined();
    expect(typeof result.booking.qrToken).toBe("string");
    expect(result.booking.qrToken!.length).toBeGreaterThan(10);
  });

  test("confirmRegistration: does not replace existing QR token when already confirmed", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.confirmRegistration("REG-1001");
    expect(queries.confirmRegistration).not.toHaveBeenCalled();
    expect(result.booking.qrToken).toBe("abc123qrtokenhex");
  });

  test("confirmRegistration: sets confirmedAt", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    confirmRegistrationMock.mockResolvedValueOnce(mockConfirmedBooking);

    const result = await registrationService.confirmRegistration("REG-1001");
    expect(result.booking.confirmedAt).toBeDefined();
    expect(result.booking.confirmedAt).not.toBeNull();
  });

  test("confirmRegistration: clears cancelledAt", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    confirmRegistrationMock.mockResolvedValueOnce(mockConfirmedBooking);

    const result = await registrationService.confirmRegistration("REG-1001");
    expect(result.booking.cancelledAt).toBeNull();
  });
});

describe("registrationService.cancelRegistration", () => {
  test("cancelRegistration: booking not found", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.cancelRegistration("missing-id", mockOwnerRequester),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("cancelRegistration: owner can cancel their own registration", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    cancelRegistrationMock.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockOwnerRequester);
    expect(result.booking.status).toBe("cancelled");
  });

  test("cancelRegistration: admin can cancel any registration", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    cancelRegistrationMock.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockAdminRequester);
    expect(result.booking.status).toBe("cancelled");
  });

  test("cancelRegistration: non-owner non-admin cannot cancel", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.cancelRegistration("REG-1001", mockStrangerRequester),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test("cancelRegistration: already checked-in user cannot cancel", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: { ...mockUser, isCheckedIn: true },
      slot: mockSlot,
    });

    await expect(
      registrationService.cancelRegistration("REG-1001", mockOwnerRequester),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("cancelRegistration: reserved booking can be cancelled", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    cancelRegistrationMock.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockOwnerRequester);
    expect(result.booking.status).toBe("cancelled");
  });

  test("cancelRegistration: confirmed booking can be cancelled only if not checked in", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: { ...mockUser, isCheckedIn: false },
      slot: mockSlot,
    });
    cancelRegistrationMock.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockOwnerRequester);
    expect(result.booking.status).toBe("cancelled");
  });

  test("cancelRegistration: already cancelled booking is handled consistently", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockCancelledBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.cancelRegistration("REG-1001", mockOwnerRequester),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("cancelRegistration: sets status = \"cancelled\"", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    cancelRegistrationMock.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockOwnerRequester);
    expect(result.booking.status).toBe("cancelled");
  });

  test("cancelRegistration: sets cancelledAt", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    cancelRegistrationMock.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockOwnerRequester);
    expect(result.booking.cancelledAt).toBeDefined();
    expect(result.booking.cancelledAt).not.toBeNull();
  });
});

describe("registrationService.getRegistration", () => {
  test("getRegistration: booking not found", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.getRegistration("missing-id", mockOwnerRequester),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("getRegistration: owner can view", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.getRegistration("REG-1001", mockOwnerRequester);
    expect(result.booking.id).toBe("REG-1001");
  });

  test("getRegistration: admin can view", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.getRegistration("REG-1001", mockAdminRequester);
    expect(result.booking.id).toBe("REG-1001");
  });

  test("getRegistration: non-owner non-admin cannot view", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistration("REG-1001", mockStrangerRequester),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test("getRegistration: returns booking, user, and slot details", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.getRegistration("REG-1001", mockOwnerRequester);
    expect(result.booking).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.slot).toBeDefined();
    expect(result.user.email).toBe("john@example.com");
  });
});

describe("registrationService.getRegistrationQr", () => {
  test("getRegistrationQr: booking not found", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.getRegistrationQr("missing-id", mockOwnerRequester),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("getRegistrationQr: owner can get QR", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.getRegistrationQr("REG-1001", mockOwnerRequester);
    expect(result.qrToken).toBe("abc123qrtokenhex");
  });

  test("getRegistrationQr: admin can get QR", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.getRegistrationQr("REG-1001", mockAdminRequester);
    expect(result.qrToken).toBe("abc123qrtokenhex");
  });

  test("getRegistrationQr: non-owner non-admin cannot get QR", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistrationQr("REG-1001", mockStrangerRequester),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test("getRegistrationQr: reserved booking cannot return QR", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistrationQr("REG-1001", mockOwnerRequester),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("getRegistrationQr: cancelled booking cannot return QR", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockCancelledBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistrationQr("REG-1001", mockOwnerRequester),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("getRegistrationQr: confirmed booking returns qrToken", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.getRegistrationQr("REG-1001", mockOwnerRequester);
    expect(result.qrToken).toBe("abc123qrtokenhex");
  });

  test("getRegistrationQr: confirmed booking with missing qrToken is handled", async () => {
    findRegistrationWithUserAndSlotMock.mockResolvedValueOnce({
      booking: { ...mockConfirmedBooking, qrToken: null },
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistrationQr("REG-1001", mockOwnerRequester),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("registrationService.scanRegistration", () => {
  test("scanRegistration: unknown QR token", async () => {
    findRegistrationForScanMock.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.scanRegistration("unknown-qr-token"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("scanRegistration: reservation id is rejected if scan must use QR token", async () => {
    findRegistrationForScanMock.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.scanRegistration("invalid-id"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("scanRegistration: reserved registration cannot check in", async () => {
    findRegistrationForScanMock.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.scanRegistration("REG-1001"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("scanRegistration: cancelled registration cannot check in", async () => {
    findRegistrationForScanMock.mockResolvedValueOnce({
      booking: mockCancelledBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.scanRegistration("REG-1001"),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("scanRegistration: unpaid user cannot check in, if payment is required", async () => {
    findRegistrationForScanMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: { ...mockUser, paid: false },
      slot: mockSlot,
    });

    await expect(
      registrationService.scanRegistration("abc123qrtokenhex"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("scanRegistration: already checked-in user returns alreadyCheckedIn: true", async () => {
    const checkedInUser = { ...mockUser, isCheckedIn: true, checkedInAt: new Date() };
    findRegistrationForScanMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: checkedInUser,
      slot: mockSlot,
    });

    const result = await registrationService.scanRegistration("abc123qrtokenhex");
    expect(result.alreadyCheckedIn).toBe(true);
    expect(result.user.id).toBe(checkedInUser.id);
  });

  test("scanRegistration: valid confirmed paid registration marks user checked in", async () => {
    const checkedInAt = new Date();
    findRegistrationForScanMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: { ...mockUser, isCheckedIn: false, paid: true },
      slot: mockSlot,
    });
    markUserCheckedInMock.mockResolvedValueOnce({
      ...mockUser,
      isCheckedIn: true,
      checkedInAt,
    });

    const result = await registrationService.scanRegistration("abc123qrtokenhex");
    expect(result.alreadyCheckedIn).toBe(false);
    expect(result.user.checkedInAt).toEqual(checkedInAt);
  });

  test("scanRegistration: first check-in sets checkedInAt", async () => {
    const checkedInAt = new Date();
    findRegistrationForScanMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: { ...mockUser, isCheckedIn: false, paid: true },
      slot: mockSlot,
    });
    markUserCheckedInMock.mockResolvedValueOnce({
      ...mockUser,
      isCheckedIn: true,
      checkedInAt,
    });

    const result = await registrationService.scanRegistration("abc123qrtokenhex");
    expect(queries.markUserCheckedIn).toHaveBeenCalledWith(mockUser.id);
    expect(result.user.checkedInAt).toEqual(checkedInAt);
  });

  test("scanRegistration: returns checked-in user and registration details", async () => {
    findRegistrationForScanMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: { ...mockUser, isCheckedIn: false, paid: true },
      slot: mockSlot,
    });
    markUserCheckedInMock.mockResolvedValueOnce({
      ...mockUser,
      isCheckedIn: true,
      checkedInAt: new Date(),
    });

    const result = await registrationService.scanRegistration("abc123qrtokenhex");
    expect(result.user).toBeDefined();
    expect(result.booking).toEqual(mockConfirmedBooking);
    expect(result.slot).toEqual(mockSlot);
  });
});
