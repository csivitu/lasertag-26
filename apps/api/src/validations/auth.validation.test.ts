import { describe, expect, test } from "bun:test";

import { loginSchema } from "./auth.validation";

const parseBody = (body: unknown) => loginSchema.parse({ body }).body;

describe("loginSchema", () => {
  test("accepts a valid email and password", () => {
    expect(parseBody({ email: "alicia@example.com", password: "hunter2" })).toEqual({
      email: "alicia@example.com",
      password: "hunter2",
    });
  });

  test("trims and lower-cases the email before validating it", () => {
    expect(parseBody({ email: "  Alicia@Example.COM  ", password: "x" }).email).toBe(
      "alicia@example.com",
    );
  });

  test("rejects a malformed email", () => {
    expect(() => parseBody({ email: "not-an-email", password: "x" })).toThrow();
  });

  test("rejects an empty password", () => {
    expect(() => parseBody({ email: "alicia@example.com", password: "" })).toThrow();
  });

  test("rejects a missing password", () => {
    expect(() => parseBody({ email: "alicia@example.com" })).toThrow();
  });

  // The password is compared by better-auth, not reshaped here — trimming it
  // would silently change what the user typed.
  test("leaves surrounding whitespace in the password alone", () => {
    expect(parseBody({ email: "a@b.com", password: "  pw  " }).password).toBe("  pw  ");
  });
});
