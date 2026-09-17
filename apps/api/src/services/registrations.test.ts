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
  mockResolvedValue(value: unknown): QueryMock<T>;
  mockResolvedValueOnce(value: unknown): QueryMock<T>;
  mockImplementationOnce(fn: T): QueryMock<T>;
};

mock.module("../data/queries", () => ({
  findSlotById: mock(),
  countActiveBookingsForSlot: mock(),
  claimSlotSeat: mock(async () => true),
  releaseSlotSeat: mock(async () => {}),
  findUserById: mock(),
  findActiveRegistrationForUser: mock(),
  createSoloRegistration: mock(),
  findRegistrationWithUserAndSlot: mock(),
  confirmRegistration: mock(),
  cancelRegistration: mock(),
  findRegistrationForScan: mock(),
  markUserCheckedIn: mock(),
  markUserRowCheckedIn: mock(async () => ({})),
}));

const findSlotByIdMock = queries.findSlotById as QueryMock<typeof queries.findSlotById>;
const countActiveBookingsForSlotMock = queries.countActiveBookingsForSlot as QueryMock<
  typeof queries.countActiveBookingsForSlot
>;
const claimSlotSeatMock = queries.claimSlotSeat as QueryMock<typeof queries.claimSlotSeat>;
const releaseSlotSeatMock = queries.releaseSlotSeat as QueryMock<typeof queries.releaseSlotSeat>;
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
const markUserRowCheckedInMock = queries.markUserRowCheckedIn as QueryMock<
  typeof queries.markUserRowCheckedIn
>;

const m = { findSlotById: findSlotByIdMock, countActiveBookingsForSlot: countActiveBookingsForSlotMock, claimSlotSeat: claimSlotSeatMock, releaseSlotSeat: releaseSlotSeatMock, findUserById: findUserByIdMock, findActiveRegistrationForUser: findActiveRegistrationForUserMock, createSoloRegistration: createSoloRegistrationMock, findRegistrationWithUserAndSlot: findRegistrationWithUserAndSlotMock, confirmRegistration: confirmRegistrationMock, cancelRegistration: cancelRegistrationMock, findRegistrationForScan: findRegistrationForScanMock, markUserCheckedIn: markUserCheckedInMock, markUserRowCheckedIn: markUserRowCheckedInMock };

const queryMocks = [
  findSlotByIdMock,
  countActiveBookingsForSlotMock,
  claimSlotSeatMock,
  releaseSlotSeatMock,
  findUserByIdMock,
  findActiveRegistrationForUserMock,
  createSoloRegistrationMock,
  findRegistrationWithUserAndSlotMock,
  confirmRegistrationMock,
  cancelRegistrationMock,
  findRegistrationForScanMock,
  markUserCheckedInMock,
  markUserRowCheckedInMock,
];

const mockSlot = {
  id: "slot-uuid-1",
  startTime: new Date("2026-10-01T10:00:00Z"),
  endTime: new Date("2026-10-01T11:00:00Z"),
  capacity: 10,
  totalCapacity: 10,
  isHidden: false,
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

const mockReservedBooking = {
  id: "REG-1001",
  type: "individual" as const,
  status: "reserved" as const,
  userId: "user-123",
  slotId: "slot-uuid-1",
  teamCode: null,
  qrToken: null,
  confirmedAt: null,
  slotChangeCount: 0,
  cancelledAt: null,
  confirmationEmailSent: false,
  createdAt: new Date(),
  isCheckedIn: false,
  checkedInAt: null,
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
  // mockReset wipes the factory default — seat claims succeed unless a test says otherwise.
  claimSlotSeatMock.mockResolvedValue(true);
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
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.confirmRegistration("missing-id", mockUser.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("confirmRegistration: cancelled booking cannot be confirmed", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockCancelledBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.confirmRegistration("REG-1001", mockUser.id),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("confirmRegistration: reserved booking can be confirmed", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    m.confirmRegistration.mockResolvedValueOnce(mockConfirmedBooking);

    const result = await registrationService.confirmRegistration("REG-1001", mockUser.id);
    expect(result.alreadyConfirmed).toBe(false);
    expect(result.booking.status).toBe("confirmed");
  });

  test("confirmRegistration: already confirmed registration is idempotent", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.confirmRegistration("REG-1001", mockUser.id);
    expect(result.alreadyConfirmed).toBe(true);
    expect(result.booking).toEqual(mockConfirmedBooking);
  });

  test("confirmRegistration: generates QR token on first confirmation", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    m.confirmRegistration.mockImplementationOnce(async (_id: string, token: string) => ({
      ...mockConfirmedBooking,
      qrToken: token,
    }));

    const result = await registrationService.confirmRegistration("REG-1001", mockUser.id);
    expect(result.booking.qrToken).toBeDefined();
    expect(typeof result.booking.qrToken).toBe("string");
    expect(result.booking.qrToken!.length).toBeGreaterThan(10);
  });

  test("confirmRegistration: does not replace existing QR token when already confirmed", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.confirmRegistration("REG-1001", mockUser.id);
    expect(queries.confirmRegistration).not.toHaveBeenCalled();
    expect(result.booking.qrToken).toBe("abc123qrtokenhex");
  });

  test("confirmRegistration: sets confirmedAt", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    m.confirmRegistration.mockResolvedValueOnce(mockConfirmedBooking);

    const result = await registrationService.confirmRegistration("REG-1001", mockUser.id);
    expect(result.booking.confirmedAt).toBeDefined();
    expect(result.booking.confirmedAt).not.toBeNull();
  });

  test("confirmRegistration: only the owner can confirm - any other userId is rejected", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    await expect(
      registrationService.confirmRegistration("REG-1001", "user-456"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test("confirmRegistration: clears cancelledAt", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    m.confirmRegistration.mockResolvedValueOnce(mockConfirmedBooking);

    const result = await registrationService.confirmRegistration("REG-1001", mockUser.id);
    expect(result.booking.cancelledAt).toBeNull();
  });
});

describe("registrationService.cancelRegistration", () => {
  test("cancelRegistration: booking not found", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.cancelRegistration("missing-id", mockUser.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("cancelRegistration: only the owner can cancel", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    m.cancelRegistration.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockUser.id);
    expect(result.booking.status).toBe("cancelled");
  });

  test("cancelRegistration: any other userId is rejected - including an admin", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });


    await expect(
      registrationService.cancelRegistration("REG-1001", "admin-999"),
    ).rejects.toBeInstanceOf(ForbiddenError);

  });

  test("cancelRegistration: any unrelated userId is also rejected", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.cancelRegistration("REG-1001", "user-456"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test("cancelRegistration: already checked-in user cannot cancel", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: { ...mockUser, isCheckedIn: true },
      slot: mockSlot,
    });

    await expect(
      registrationService.cancelRegistration("REG-1001", mockUser.id),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("cancelRegistration: reserved booking can be cancelled", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    m.cancelRegistration.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockUser.id);
    expect(result.booking.status).toBe("cancelled");
  });

  test("cancelRegistration: confirmed booking can be cancelled only if not checked in", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: { ...mockUser, isCheckedIn: false },
      slot: mockSlot,
    });
    m.cancelRegistration.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockUser.id);
    expect(result.booking.status).toBe("cancelled");
  });

  test("cancelRegistration: already cancelled booking is handled consistently", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockCancelledBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.cancelRegistration("REG-1001", mockUser.id),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("cancelRegistration: sets status = \"cancelled\"", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    m.cancelRegistration.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockUser.id);
    expect(result.booking.status).toBe("cancelled");
  });

  test("cancelRegistration: sets cancelledAt", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });
    m.cancelRegistration.mockResolvedValueOnce(mockCancelledBooking);

    const result = await registrationService.cancelRegistration("REG-1001", mockUser.id);
    expect(result.booking.cancelledAt).toBeDefined();
    expect(result.booking.cancelledAt).not.toBeNull();
  });
});

describe("registrationService.getRegistration", () => {
  test("getRegistration: booking not found", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.getRegistration("missing-id", mockUser.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("getRegistration: only the owner can view their registration", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.getRegistration("REG-1001", mockUser.id);
    expect(result.booking.id).toBe("REG-1001");
  });

  test("getRegistration: any other userId is rejected - including an admin", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistration("REG-1001", "admin-999"),
    ).rejects.toBeInstanceOf(ForbiddenError);

  });

  test("getRegistration: any unrelated userId is also rejected", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistration("REG-1001", "user-456"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test("getRegistration: returns booking, user, and slot details", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.getRegistration("REG-1001", mockUser.id);
    expect(result.booking).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.slot).toBeDefined();
    expect(result.user.email).toBe("john@example.com");
  });
});

describe("registrationService.getRegistrationQr", () => {
  test("getRegistrationQr: booking not found", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce(undefined);

    await expect(
      registrationService.getRegistrationQr("missing-id", mockUser.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("getRegistrationQr: only the owner can retrieve their QR", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.getRegistrationQr("REG-1001", mockUser.id);
    expect(result.qrToken).toBe("abc123qrtokenhex");
  });

  test("getRegistrationQr: any other userId is rejected - including an admin", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistrationQr("REG-1001", "admin-999"),
    ).rejects.toBeInstanceOf(ForbiddenError);

  });

  test("getRegistrationQr: any unrelated userId is also rejected", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistrationQr("REG-1001", "user-456"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test("getRegistrationQr: reserved booking cannot return QR", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockReservedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistrationQr("REG-1001", mockUser.id),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("getRegistrationQr: cancelled booking cannot return QR", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockCancelledBooking,
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistrationQr("REG-1001", mockUser.id),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("getRegistrationQr: confirmed booking returns qrToken", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: mockUser,
      slot: mockSlot,
    });

    const result = await registrationService.getRegistrationQr("REG-1001", mockUser.id);
    expect(result.qrToken).toBe("abc123qrtokenhex");
  });

  test("getRegistrationQr: confirmed booking with missing qrToken is handled", async () => {
    m.findRegistrationWithUserAndSlot.mockResolvedValueOnce({
      booking: { ...mockConfirmedBooking, qrToken: null },
      user: mockUser,
      slot: mockSlot,
    });

    await expect(
      registrationService.getRegistrationQr("REG-1001", mockUser.id),
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
      ...mockConfirmedBooking,
      isCheckedIn: true,
      checkedInAt,
    });

    const result = await registrationService.scanRegistration("abc123qrtokenhex");
    expect(queries.markUserCheckedIn).toHaveBeenCalledWith(mockConfirmedBooking.id);
    expect(queries.markUserRowCheckedIn).toHaveBeenCalledWith(mockUser.id);
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
    expect(result.booking).toBeDefined();
    expect(result.slot).toEqual(mockSlot);
  });

  test("scanRegistration: markUserCheckedIn is called with booking id, not user id", async () => {
    findRegistrationForScanMock.mockResolvedValueOnce({
      booking: mockConfirmedBooking,
      user: { ...mockUser, isCheckedIn: false, paid: true },
      slot: mockSlot,
    });
    markUserCheckedInMock.mockResolvedValueOnce({
      ...mockConfirmedBooking,
      isCheckedIn: true,
      checkedInAt: new Date(),
    });

    await registrationService.scanRegistration("abc123qrtokenhex");
    // Must be called with the booking id — never the user id
    expect(queries.markUserCheckedIn).toHaveBeenCalledWith(mockConfirmedBooking.id);
    expect(queries.markUserCheckedIn).not.toHaveBeenCalledWith(mockUser.id);
  });
});
