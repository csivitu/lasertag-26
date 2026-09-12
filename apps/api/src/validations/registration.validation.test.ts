import { describe, expect, test } from "bun:test";

import {
  getRegistrationSchema,
  registrationQuerySchema,
  soloRegistrationSchema,
} from "./registration.validation";

const parseQuery = (query: unknown) => registrationQuerySchema.parse({ query }).query;
const parseSoloBody = (body: unknown) => soloRegistrationSchema.parse({ body }).body;
const parseReservationParams = (params: unknown) =>
  getRegistrationSchema.parse({ params }).params;

describe("registrationQuerySchema", () => {
  test("treats a blank value as absent", () => {
    expect(parseQuery({ name: "" })).toEqual({});
  });

  test("treats a whitespace-only value as absent", () => {
    expect(parseQuery({ name: "   " })).toEqual({});
  });

  test("trims a value with surrounding whitespace", () => {
    expect(parseQuery({ name: " a " })).toEqual({ name: "a" });
  });

  test("takes the first value when a key is repeated", () => {
    expect(parseQuery({ name: ["a", "b"] })).toEqual({ name: "a" });
  });

  test("returns an empty object when no params are given", () => {
    expect(parseQuery({})).toEqual({});
  });

  test("ignores unknown query params", () => {
    expect(parseQuery({ name: "a", bogus: "x" })).toEqual({ name: "a" });
  });
});

describe("soloRegistrationSchema", () => {
  test("accepts a slot_id UUID in the body", () => {
    expect(parseSoloBody({ slot_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6" })).toEqual({
      slot_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    });
  });

  test("rejects a missing slot_id", () => {
    expect(() => parseSoloBody({})).toThrow();
  });

  test("rejects a non-UUID slot_id", () => {
    expect(() => parseSoloBody({ slot_id: "slot-123" })).toThrow();
  });

  test("does not accept user_id from the public registration body", () => {
    expect(
      parseSoloBody({
        slot_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        user_id: "user-123",
      }),
    ).toEqual({ slot_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6" });
  });
});

describe("reservation id schemas", () => {
  test("trims reservation_id path params", () => {
    expect(parseReservationParams({ reservation_id: " REG-1001 " })).toEqual({
      reservation_id: "REG-1001",
    });
  });

  test("rejects blank reservation_id path params", () => {
    expect(() => parseReservationParams({ reservation_id: "   " })).toThrow();
  });
});
