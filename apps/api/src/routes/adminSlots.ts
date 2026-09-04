import { Router, type Request, type Response } from "express";
import { count, eq } from "drizzle-orm";
import { db, slots, bookings } from "@lasertag-26/database";

export const adminSlotsRouter = Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SlotInput = {
  startTime: Date;
  endTime: Date;
  capacity: number;
};

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isValidCapacity(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** Parses and validates a single slot payload. Returns an error string, or null if valid. */
function parseSlotInput(
  body: unknown
): { value: SlotInput } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Slot must be an object" };
  }
  const { startTime, endTime, capacity } = body as Record<string, unknown>;

  if (!isValidDateString(startTime)) {
    return { error: "startTime must be a valid ISO date string" };
  }
  if (!isValidDateString(endTime)) {
    return { error: "endTime must be a valid ISO date string" };
  }
  if (!isValidCapacity(capacity)) {
    return { error: "capacity must be a non-negative integer" };
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (start >= end) {
    return { error: "startTime must be before endTime" };
  }

  return { value: { startTime: start, endTime: end, capacity } };
}

/** Number of bookings currently made against a slot. */
async function getBookingCount(slotId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(bookings)
    .where(eq(bookings.slotId, slotId));
  return row?.value ?? 0;
}

// GET /admin/slots — list all slots
adminSlotsRouter.get("/", async (_req: Request, res: Response) => {
  const allSlots = await db.select().from(slots);
  res.json(allSlots);
});

// POST /admin/slots — create one slot
adminSlotsRouter.post("/", async (req: Request, res: Response) => {
  const parsed = parseSlotInput(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const [created] = await db.insert(slots).values(parsed.value).returning();
  res.status(201).json(created);
});

// POST /admin/slots/bulk — create multiple slots from an array in the body
adminSlotsRouter.post("/bulk", async (req: Request, res: Response) => {
  const body = req.body;
  if (!Array.isArray(body) || body.length === 0) {
    res.status(400).json({ error: "Request body must be a non-empty array of slots" });
    return;
  }

  const values: SlotInput[] = [];
  for (let i = 0; i < body.length; i++) {
    const parsed = parseSlotInput(body[i]);
    if ("error" in parsed) {
      res.status(400).json({ error: `Slot at index ${i}: ${parsed.error}` });
      return;
    }
    values.push(parsed.value);
  }

  const created = await db.insert(slots).values(values).returning();
  res.status(201).json(created);
});

// PATCH /admin/slots/:slot_id — edit a slot
adminSlotsRouter.patch("/:slot_id", async (req: Request, res: Response) => {
  const { slot_id } = req.params;
  if (typeof slot_id !== "string" || !UUID_RE.test(slot_id)) {
    res.status(400).json({ error: "slot_id must be a valid UUID" });
    return;
  }

  const [existing] = await db.select().from(slots).where(eq(slots.id, slot_id));
  if (!existing) {
    res.status(404).json({ error: "Slot not found" });
    return;
  }

  const body = req.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    res.status(400).json({ error: "Request body must be an object" });
    return;
  }
  const { startTime, endTime, capacity } = body as Record<string, unknown>;

  const updates: Partial<typeof slots.$inferInsert> = {};

  if (startTime !== undefined) {
    if (!isValidDateString(startTime)) {
      res.status(400).json({ error: "startTime must be a valid ISO date string" });
      return;
    }
    updates.startTime = new Date(startTime);
  }
  if (endTime !== undefined) {
    if (!isValidDateString(endTime)) {
      res.status(400).json({ error: "endTime must be a valid ISO date string" });
      return;
    }
    updates.endTime = new Date(endTime);
  }
  if (capacity !== undefined) {
    if (!isValidCapacity(capacity)) {
      res.status(400).json({ error: "capacity must be a non-negative integer" });
      return;
    }
    updates.capacity = capacity;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const nextStart = updates.startTime ?? existing.startTime;
  const nextEnd = updates.endTime ?? existing.endTime;
  if (nextStart >= nextEnd) {
    res.status(400).json({ error: "startTime must be before endTime" });
    return;
  }

  // Reducing capacity below the number of people already booked into this
  // slot would silently overbook it — block that instead.
  if (updates.capacity !== undefined && updates.capacity < existing.capacity) {
    const bookingCount = await getBookingCount(slot_id);
    if (bookingCount > 0 && updates.capacity < bookingCount) {
      res.status(409).json({
        error: "Cannot reduce capacity below the current booking count",
        bookingCount,
        requestedCapacity: updates.capacity,
      });
      return;
    }
  }

  const [updated] = await db
    .update(slots)
    .set(updates)
    .where(eq(slots.id, slot_id))
    .returning();

  res.json(updated);
});

// DELETE /admin/slots/:slot_id — delete a slot
adminSlotsRouter.delete("/:slot_id", async (req: Request, res: Response) => {
  const { slot_id } = req.params;
  if (typeof slot_id !== "string" || !UUID_RE.test(slot_id)) {
    res.status(400).json({ error: "slot_id must be a valid UUID" });
    return;
  }

  const [existing] = await db.select().from(slots).where(eq(slots.id, slot_id));
  if (!existing) {
    res.status(404).json({ error: "Slot not found" });
    return;
  }

  const bookingCount = await getBookingCount(slot_id);
  if (bookingCount > 0) {
    res.status(409).json({
      error: "Cannot delete a slot with existing bookings",
      bookingCount,
    });
    return;
  }

  await db.delete(slots).where(eq(slots.id, slot_id));
  res.status(204).send();
});
