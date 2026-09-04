import { Router, type Request, type Response } from "express";
import { count, eq } from "drizzle-orm";
import { db, slots, bookings } from "@lasertag-26/database";

export const adminSlotsRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Slot:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *         startTime:
 *           type: string
 *           format: date-time
 *           example: 2026-03-14T09:00:00.000Z
 *         endTime:
 *           type: string
 *           format: date-time
 *           example: 2026-03-14T10:00:00.000Z
 *         capacity:
 *           type: integer
 *           example: 10
 *     SlotInput:
 *       type: object
 *       required: [startTime, endTime, capacity]
 *       properties:
 *         startTime:
 *           type: string
 *           format: date-time
 *           example: 2026-03-14T09:00:00.000Z
 *         endTime:
 *           type: string
 *           format: date-time
 *           example: 2026-03-14T10:00:00.000Z
 *         capacity:
 *           type: integer
 *           minimum: 0
 *           example: 10
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Slot not found
 */

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

/**
 * @swagger
 * /admin/slots:
 *   get:
 *     summary: List all slots
 *     tags: [Slots]
 *     responses:
 *       200:
 *         description: Array of slots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Slot'
 *             example:
 *               - id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                 startTime: 2026-03-14T09:00:00.000Z
 *                 endTime: 2026-03-14T10:00:00.000Z
 *                 capacity: 10
 *               - id: 7c9e6679-7425-40de-944b-e07fc1f90ae7
 *                 startTime: 2026-03-14T10:00:00.000Z
 *                 endTime: 2026-03-14T11:00:00.000Z
 *                 capacity: 8
 */
adminSlotsRouter.get("/", async (_req: Request, res: Response) => {
  const allSlots = await db.select().from(slots);
  res.json(allSlots);
});

/**
 * @swagger
 * /admin/slots:
 *   post:
 *     summary: Create one slot
 *     tags: [Slots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SlotInput'
 *           example:
 *             startTime: 2026-03-14T09:00:00.000Z
 *             endTime: 2026-03-14T10:00:00.000Z
 *             capacity: 10
 *     responses:
 *       201:
 *         description: The created slot
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Slot'
 *             example:
 *               id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *               startTime: 2026-03-14T09:00:00.000Z
 *               endTime: 2026-03-14T10:00:00.000Z
 *               capacity: 10
 *       400:
 *         description: Invalid input (bad dates, startTime not before endTime, or negative capacity)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: capacity must be a non-negative integer
 */
adminSlotsRouter.post("/", async (req: Request, res: Response) => {
  const parsed = parseSlotInput(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const [created] = await db.insert(slots).values(parsed.value).returning();
  res.status(201).json(created);
});

/**
 * @swagger
 * /admin/slots/bulk:
 *   post:
 *     summary: Create multiple slots
 *     tags: [Slots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/SlotInput'
 *           example:
 *             - startTime: 2026-03-14T09:00:00.000Z
 *               endTime: 2026-03-14T10:00:00.000Z
 *               capacity: 10
 *             - startTime: 2026-03-14T10:00:00.000Z
 *               endTime: 2026-03-14T11:00:00.000Z
 *               capacity: 8
 *     responses:
 *       201:
 *         description: The created slots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Slot'
 *             example:
 *               - id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *                 startTime: 2026-03-14T09:00:00.000Z
 *                 endTime: 2026-03-14T10:00:00.000Z
 *                 capacity: 10
 *               - id: 7c9e6679-7425-40de-944b-e07fc1f90ae7
 *                 startTime: 2026-03-14T10:00:00.000Z
 *                 endTime: 2026-03-14T11:00:00.000Z
 *                 capacity: 8
 *       400:
 *         description: Invalid input — request body must be a non-empty array, and every slot must pass the same validation as the single-create endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: 'Slot at index 1: startTime must be before endTime'
 */
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

/**
 * @swagger
 * /admin/slots/{slot_id}:
 *   patch:
 *     summary: Edit a slot
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: slot_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *     requestBody:
 *       required: true
 *       description: Any subset of these fields; only the given ones are changed.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               capacity:
 *                 type: integer
 *                 minimum: 0
 *           example:
 *             capacity: 6
 *     responses:
 *       200:
 *         description: The updated slot
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Slot'
 *             example:
 *               id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *               startTime: 2026-03-14T09:00:00.000Z
 *               endTime: 2026-03-14T10:00:00.000Z
 *               capacity: 6
 *       400:
 *         description: Invalid slot_id, invalid field values, or startTime not before endTime
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: capacity must be a non-negative integer
 *       404:
 *         description: Slot not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Slot not found
 *       409:
 *         description: capacity would drop below the slot's current booking count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 bookingCount:
 *                   type: integer
 *                 requestedCapacity:
 *                   type: integer
 *             example:
 *               error: Cannot reduce capacity below the current booking count
 *               bookingCount: 8
 *               requestedCapacity: 6
 */
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

/**
 * @swagger
 * /admin/slots/{slot_id}:
 *   delete:
 *     summary: Delete a slot
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: slot_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *     responses:
 *       204:
 *         description: Slot deleted
 *       400:
 *         description: slot_id is not a valid UUID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: slot_id must be a valid UUID
 *       404:
 *         description: Slot not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Slot not found
 *       409:
 *         description: Slot has existing bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 bookingCount:
 *                   type: integer
 *             example:
 *               error: Cannot delete a slot with existing bookings
 *               bookingCount: 8
 */
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
