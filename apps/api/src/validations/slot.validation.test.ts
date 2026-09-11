import { describe, expect, test } from "bun:test";

import {
  bulkCreateSlotsSchema,
  slotIdSchema,
  slotInputSchema,
} from "./slot.validation";

const validInput = {
  startTime: "2026-03-14T09:00:00.000Z",
  endTime: "2026-03-14T10:00:00.000Z",
  capacity: 10,
};

describe("slotInputSchema", () => {
  test("parses valid ISO strings into Dates", () => {
    const result = slotInputSchema.parse(validInput);
    expect(result.startTime).toBeInstanceOf(Date);
    expect(result.endTime).toBeInstanceOf(Date);
    expect(result.capacity).toEqual(10);
  });

  test("rejects startTime equal to endTime", () => {
    expect(() => slotInputSchema.parse({ ...validInput, endTime: validInput.startTime })).toThrow();
  });

  test("rejects negative capacity", () => {
    expect(() => slotInputSchema.parse({ ...validInput, capacity: -1 })).toThrow();
  });

  test("rejects fractional capacity", () => {
    expect(() => slotInputSchema.parse({ ...validInput, capacity: 1.5 })).toThrow();
  });

  test("strips a client-supplied id rather than honouring it", () => {
    const result = slotInputSchema.parse({ ...validInput, id: "not-real" });
    expect(result).not.toHaveProperty("id");
  });

  test("rejects a non-ISO date string", () => {
    expect(() => slotInputSchema.parse({ ...validInput, startTime: "2026-03-14" })).toThrow();
  });
});

describe("bulkCreateSlotsSchema", () => {
  test("rejects an empty array", () => {
    expect(() => bulkCreateSlotsSchema.parse({ body: [] })).toThrow();
  });

  test("tags the failing element's index in the issue path", () => {
    const bad = { ...validInput, endTime: validInput.startTime };
    try {
      bulkCreateSlotsSchema.parse({ body: [validInput, bad] });
      throw new Error("expected parse to throw");
    } catch (err) {
      const zodErr = err as import("zod").ZodError;
      expect(zodErr.issues[0]?.path).toEqual(["body", 1, "startTime"]);
    }
  });

  test("accepts a non-empty array of valid slots", () => {
    const result = bulkCreateSlotsSchema.parse({ body: [validInput, validInput] });
    expect(result.body).toHaveLength(2);
  });
});

describe("slotIdSchema", () => {
  test("rejects a non-UUID", () => {
    expect(() => slotIdSchema.parse({ params: { slot_id: "not-a-uuid" } })).toThrow();
  });

  test("accepts a real UUID", () => {
    const result = slotIdSchema.parse({
      params: { slot_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6" },
    });
    expect(result.params.slot_id).toBe("3fa85f64-5717-4562-b3fc-2c963f66afa6");
  });
});
