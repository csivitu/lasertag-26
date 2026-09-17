import { describe, expect, mock, test } from "bun:test";

import { ConflictError, NotFoundError, ValidationError } from "../errors";
import {
  assertCapacityFitsBookings,
  makeSlotsService,
  resolveSlotWindow,
  type Slot,
  type SlotInput,
  type SlotPatch,
  type SlotsDeps,
} from "./slots";

const baseSlot: Slot = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  startTime: new Date("2026-03-14T09:00:00.000Z"),
  endTime: new Date("2026-03-14T10:00:00.000Z"),
  capacity: 10,
  totalCapacity: 10,
};

function makeDeps(overrides: Partial<SlotsDeps> = {}): SlotsDeps {
  return {
    listSlots: mock(async () => [baseSlot]),
    findSlot: mock(async () => baseSlot),
    countActiveBookings: mock(async () => 0),
    insertSlots: mock(async (values: SlotInput[]) =>
      values.map((v, i) => ({ id: `id-${i}`, ...v, totalCapacity: 10 })),
    ),
    applyUpdate: mock(async (_id: string, patch: SlotPatch) => ({ ...baseSlot, ...patch })),
    removeSlot: mock(async () => {}),
    ...overrides,
  };
}

describe("resolveSlotWindow", () => {
  test("throws when the patched startTime is not before the stored endTime", () => {
    expect(() =>
      resolveSlotWindow(baseSlot, { startTime: new Date("2026-03-14T11:00:00.000Z") }),
    ).toThrow(ValidationError);
  });

  test("throws when the patched endTime is not after the stored startTime", () => {
    expect(() =>
      resolveSlotWindow(baseSlot, { endTime: new Date("2026-03-14T08:00:00.000Z") }),
    ).toThrow(ValidationError);
  });

  test("accepts both fields swapped to a valid new window", () => {
    const result = resolveSlotWindow(baseSlot, {
      startTime: new Date("2026-03-14T12:00:00.000Z"),
      endTime: new Date("2026-03-14T13:00:00.000Z"),
    });
    expect(result).toEqual({
      startTime: new Date("2026-03-14T12:00:00.000Z"),
      endTime: new Date("2026-03-14T13:00:00.000Z"),
    });
  });

  test("throws when startTime equals endTime", () => {
    expect(() =>
      resolveSlotWindow(baseSlot, { startTime: baseSlot.endTime, endTime: baseSlot.endTime }),
    ).toThrow(ValidationError);
  });
});

describe("assertCapacityFitsBookings", () => {
  test("throws when requested capacity is below the booking count", () => {
    expect(() => assertCapacityFitsBookings(6, 8)).toThrow(ConflictError);
  });

  test("does not throw when requested capacity equals the booking count", () => {
    expect(() => assertCapacityFitsBookings(8, 8)).not.toThrow();
  });

  test("does not throw when there are no bookings", () => {
    expect(() => assertCapacityFitsBookings(0, 0)).not.toThrow();
  });

  test("attaches bookingCount and requestedCapacity to the error", () => {
    try {
      assertCapacityFitsBookings(6, 8);
      throw new Error("expected assertCapacityFitsBookings to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictError);
      expect((err as ConflictError).detail).toEqual({ bookingCount: 8, requestedCapacity: 6 });
    }
  });
});

describe("makeSlotsService", () => {
  test("create: propagates ConflictError if slot window overlaps an existing slot", async () => {
    const deps = makeDeps({
      insertSlots: mock(async () => {
        throw new ConflictError("Slot time overlaps with an existing slot.");
      }),
    });
    const service = makeSlotsService(deps);

    await expect(
      service.create({
        startTime: new Date("2026-03-14T09:30:00.000Z"),
        endTime: new Date("2026-03-14T10:30:00.000Z"),
        capacity: 10,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("createMany: propagates ConflictError if any slot overlaps", async () => {
    const deps = makeDeps({
      insertSlots: mock(async () => {
        throw new ConflictError("Slot time overlaps with an existing slot.");
      }),
    });
    const service = makeSlotsService(deps);

    await expect(
      service.createMany([
        {
          startTime: new Date("2026-03-14T09:30:00.000Z"),
          endTime: new Date("2026-03-14T10:30:00.000Z"),
          capacity: 10,
        },
      ]),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test("update: 409s with bookingCount/requestedCapacity when capacity drops below bookings", async () => {
    const deps = makeDeps({ countActiveBookings: mock(async () => 8) });
    const service = makeSlotsService(deps);

    try {
      await service.update(baseSlot.id, { capacity: 6 });
      throw new Error("expected update to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictError);
      expect((err as ConflictError).detail).toEqual({ bookingCount: 8, requestedCapacity: 6 });
    }
    expect(deps.applyUpdate).not.toHaveBeenCalled();
  });

  test("update: succeeds when capacity equals the booking count", async () => {
    const deps = makeDeps({ countActiveBookings: mock(async () => 8) });
    const service = makeSlotsService(deps);

    const updated = await service.update(baseSlot.id, { capacity: 8 });
    expect(updated.capacity).toBe(8);
  });

  test("update: never counts bookings when capacity is raised", async () => {
    const countActiveBookings = mock(async () => 0);
    const deps = makeDeps({ countActiveBookings });
    const service = makeSlotsService(deps);

    await service.update(baseSlot.id, { capacity: 12 });
    expect(countActiveBookings).not.toHaveBeenCalled();
  });

  test("update: never counts bookings when capacity is unchanged", async () => {
    const countActiveBookings = mock(async () => 0);
    const deps = makeDeps({ countActiveBookings });
    const service = makeSlotsService(deps);

    await service.update(baseSlot.id, { startTime: new Date("2026-03-14T09:30:00.000Z") });
    expect(countActiveBookings).not.toHaveBeenCalled();
  });

  test("update: 404s on an unknown id and never calls applyUpdate", async () => {
    const deps = makeDeps({ findSlot: mock(async () => undefined) });
    const service = makeSlotsService(deps);

    await expect(service.update("missing", { capacity: 5 })).rejects.toBeInstanceOf(NotFoundError);
    expect(deps.applyUpdate).not.toHaveBeenCalled();
  });

  test("remove: 409s when the slot has bookings, and never deletes", async () => {
    const deps = makeDeps({ countActiveBookings: mock(async () => 3) });
    const service = makeSlotsService(deps);

    try {
      await service.remove(baseSlot.id);
      throw new Error("expected remove to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictError);
      expect((err as ConflictError).detail).toEqual({ bookingCount: 3 });
    }
    expect(deps.removeSlot).not.toHaveBeenCalled();
  });

  test("remove: 404s on an unknown id before checking bookings", async () => {
    const countActiveBookings = mock(async () => 0);
    const deps = makeDeps({ findSlot: mock(async () => undefined), countActiveBookings });
    const service = makeSlotsService(deps);

    await expect(service.remove("missing")).rejects.toBeInstanceOf(NotFoundError);
    expect(countActiveBookings).not.toHaveBeenCalled();
  });

  test("remove: succeeds when there are no bookings", async () => {
    const deps = makeDeps({ countActiveBookings: mock(async () => 0) });
    const service = makeSlotsService(deps);

    await service.remove(baseSlot.id);
    expect(deps.removeSlot).toHaveBeenCalledWith(baseSlot.id);
  });
});
