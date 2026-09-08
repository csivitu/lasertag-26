import { describe, expect, mock, test } from "bun:test";

import { NotFoundError } from "../errors";
import { makePaymentsService, type PaymentDetail, type PaymentsDeps } from "./payments";

const detail: PaymentDetail = {
  bookingId: "reg-2026-0001",
  type: "individual",
  userId: "user-1",
  paid: false,
  userName: "Alicia Rao",
  userEmail: "alicia@example.com",
};

function makeDeps(overrides: Partial<PaymentsDeps> = {}): PaymentsDeps {
  return {
    findBookingWithUser: mock(async () => detail),
    findBookingUserId: mock(async () => "user-1"),
    setUserPaid: mock(async () => ({
      id: "user-1",
      name: "Alicia Rao",
      email: "alicia@example.com",
      paid: true,
    })),
    ...overrides,
  };
}

describe("makePaymentsService.getDetails", () => {
  test("returns the joined booking + user row", async () => {
    const service = makePaymentsService(makeDeps());

    expect(await service.getDetails("reg-2026-0001")).toEqual(detail);
  });

  test("throws NotFoundError when the registration doesn't exist", async () => {
    const service = makePaymentsService(
      makeDeps({ findBookingWithUser: mock(async () => undefined) }),
    );

    await expect(service.getDetails("missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("makePaymentsService.updateStatus", () => {
  test("marks the booking's user paid", async () => {
    const deps = makeDeps();
    const service = makePaymentsService(deps);

    const result = await service.updateStatus("reg-2026-0001", true);

    expect(deps.findBookingUserId).toHaveBeenCalledWith("reg-2026-0001");
    expect(deps.setUserPaid).toHaveBeenCalledWith("user-1", true);
    expect(result.paid).toBe(true);
  });

  test("throws NotFoundError when the registration doesn't exist", async () => {
    const deps = makeDeps({ findBookingUserId: mock(async () => undefined) });
    const service = makePaymentsService(deps);

    await expect(service.updateStatus("missing", true)).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.setUserPaid).not.toHaveBeenCalled();
  });
});
