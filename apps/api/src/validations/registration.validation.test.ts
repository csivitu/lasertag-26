import { describe, expect, test } from "bun:test";

import { registrationQuerySchema } from "./registration.validation";

const parseQuery = (query: unknown) => registrationQuerySchema.parse({ query }).query;

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
