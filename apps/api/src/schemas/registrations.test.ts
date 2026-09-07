import { describe, expect, test } from "bun:test";

import { registrationQuerySchema } from "./registrations";

describe("registrationQuerySchema", () => {
  test("treats a blank value as absent", () => {
    expect(registrationQuerySchema.parse({ name: "" })).toEqual({});
  });

  test("treats a whitespace-only value as absent", () => {
    expect(registrationQuerySchema.parse({ name: "   " })).toEqual({});
  });

  test("trims a value with surrounding whitespace", () => {
    expect(registrationQuerySchema.parse({ name: " a " })).toEqual({ name: "a" });
  });

  test("takes the first value when a key is repeated", () => {
    expect(registrationQuerySchema.parse({ name: ["a", "b"] })).toEqual({ name: "a" });
  });

  test("returns an empty object when no params are given", () => {
    expect(registrationQuerySchema.parse({})).toEqual({});
  });

  test("ignores unknown query params", () => {
    expect(registrationQuerySchema.parse({ name: "a", bogus: "x" })).toEqual({ name: "a" });
  });
});
