import { describe, expect, test } from "bun:test";

import { bulkCreateSlotsSchema, createSlotSchema, slotIdParamsSchema } from "./slots";

const validInput = {
  startTime: "2026-03-14T09:00:00.000Z",
  endTime: "2026-03-14T10:00:00.000Z",
  capacity: 10,
};

describe("createSlotSchema", () => {
  test("parses valid ISO strings into Dates", () => {
    const result = createSlotSchema.parse(validInput);
    expect(result.startTime).toBeInstanceOf(Date);
    expect(result.endTime).toBeInstanceOf(Date);
    expect(result.capacity).toBe(10);
  });

  test("rejects startTime equal to endTime", () => {
    expect(() =>
      createSlotSchema.parse({ ...validInput, endTime: validInput.startTime }),
    ).toThrow();
  });

  test("rejects negative capacity", () => {
    expect(() => createSlotSchema.parse({ ...validInput, capacity: -1 })).toThrow();
  });

  test("rejects fractional capacity", () => {
    expect(() => createSlotSchema.parse({ ...validInput, capacity: 1.5 })).toThrow();
  });

  test("strips a client-supplied id rather than honouring it", () => {
    const result = createSlotSchema.parse({ ...validInput, id: "not-real" });
    expect(result).not.toHaveProperty("id");
  });

  test("rejects a non-ISO date string", () => {
    expect(() => createSlotSchema.parse({ ...validInput, startTime: "2026-03-14" })).toThrow();
  });
});

describe("bulkCreateSlotsSchema", () => {
  test("rejects an empty array", () => {
    expect(() => bulkCreateSlotsSchema.parse([])).toThrow();
  });

  test("tags the failing element's index in the issue path", () => {
    const bad = { ...validInput, endTime: validInput.startTime };
    try {
      bulkCreateSlotsSchema.parse([validInput, bad]);
      throw new Error("expected parse to throw");
    } catch (err) {
      const zodErr = err as import("zod").ZodError;
      expect(zodErr.issues[0]?.path).toEqual([1, "startTime"]);
    }
  });

  test("accepts a non-empty array of valid slots", () => {
    const result = bulkCreateSlotsSchema.parse([validInput, validInput]);
    expect(result).toHaveLength(2);
  });
});

describe("slotIdParamsSchema", () => {
  test("rejects a non-UUID", () => {
    expect(() => slotIdParamsSchema.parse({ slot_id: "not-a-uuid" })).toThrow();
  });

  test("accepts a real UUID", () => {
    const result = slotIdParamsSchema.parse({
      slot_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    });
    expect(result.slot_id).toBe("3fa85f64-5717-4562-b3fc-2c963f66afa6");
  });
});
