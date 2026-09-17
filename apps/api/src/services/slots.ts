import type { slots } from "@lasertag-26/database";

import { ConflictError, NotFoundError, ValidationError } from "../errors";

export type Slot = typeof slots.$inferSelect & { bookedCount?: number };
export type SlotInput = { startTime: Date; endTime: Date; capacity: number; isHidden?: boolean };
export type SlotPatch = Partial<SlotInput>;

/** Everything this service needs from the database, and nothing more. */
export interface SlotsDeps {
  listSlots(): Promise<Slot[]>;
  findSlot(id: string): Promise<Slot | undefined>;
  // Active bookings only: cancelled rows no longer occupy seats, so guards
  // built on the all-rows count would block valid deletes and reductions.
  countActiveBookings(slotId: string): Promise<number>;
  insertSlots(values: SlotInput[]): Promise<Slot[]>;
  applyUpdate(id: string, patch: SlotPatch): Promise<Slot>;
  removeSlot(id: string): Promise<void>;
}

/**
 * Merges a patch over the stored row and checks the window is still valid.
 *
 * This rule cannot live in the zod schema: on a PATCH carrying only
 * `startTime`, the value it must be compared against is in the database. Doing
 * the merge here keeps one rule in one place instead of a partial copy in the
 * schema and another here.
 *
 * @throws ValidationError
 */
export function resolveSlotWindow(
  existing: Slot,
  patch: SlotPatch,
): { startTime: Date; endTime: Date } {
  const startTime = patch.startTime ?? existing.startTime;
  const endTime = patch.endTime ?? existing.endTime;

  if (startTime >= endTime) {
    throw new ValidationError("startTime must be before endTime");
  }

  return { startTime, endTime };
}

/**
 * Refuses a capacity that would put the slot below the people already booked
 * into it. Equal is allowed — a full slot is valid, an overbooked one is not.
 *
 * @throws ConflictError
 */
export function assertCapacityFitsBookings(
  requestedCapacity: number,
  bookingCount: number,
): void {
  if (bookingCount > 0 && requestedCapacity < bookingCount) {
    throw new ConflictError("Cannot reduce capacity below the current booking count", {
      bookingCount,
      requestedCapacity,
    });
  }
}

export function makeSlotsService(deps: SlotsDeps) {
  /** @throws NotFoundError */
  async function requireSlot(id: string): Promise<Slot> {
    const slot = await deps.findSlot(id);
    if (!slot) throw new NotFoundError("Slot not found");
    return slot;
  }

  return {
    list(): Promise<Slot[]> {
      return deps.listSlots();
    },

    async create(input: SlotInput): Promise<Slot> {
      const [created] = await deps.insertSlots([input]);
      return created!;
    },

    createMany(inputs: SlotInput[]): Promise<Slot[]> {
      return deps.insertSlots(inputs);
    },

    /** @throws NotFoundError, ValidationError, ConflictError */
    async update(id: string, patch: SlotPatch): Promise<Slot> {
      const existing = await requireSlot(id);

      resolveSlotWindow(existing, patch);

      // Only a reduction can overbook a slot, so skip the count query when
      // capacity is unchanged or going up.
      if (patch.capacity !== undefined && patch.capacity < existing.capacity) {
        assertCapacityFitsBookings(patch.capacity, await deps.countActiveBookings(id));
      }

      return deps.applyUpdate(id, patch);
    },

    /** @throws NotFoundError, ConflictError */
    async remove(id: string): Promise<void> {
      await requireSlot(id);

      const bookingCount = await deps.countActiveBookings(id);
      if (bookingCount > 0) {
        throw new ConflictError("Cannot delete a slot with existing bookings", {
          bookingCount,
        });
      }

      await deps.removeSlot(id);
    },
  };
}

export type SlotsService = ReturnType<typeof makeSlotsService>;
