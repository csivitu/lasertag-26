import { describe, expect, test } from "bun:test";

import { getPaymentDetailsSchema, updatePaymentSchema } from "./payment.validation";

describe("getPaymentDetailsSchema", () => {
  test("trims the registration id", () => {
    const result = getPaymentDetailsSchema.parse({ params: { registration_id: " reg-1 " } });
    expect(result.params.registration_id).toBe("reg-1");
  });

  test("rejects a blank registration id", () => {
    expect(() => getPaymentDetailsSchema.parse({ params: { registration_id: "   " } })).toThrow();
  });
});

describe("updatePaymentSchema", () => {
  test("accepts a boolean paid flag", () => {
    const result = updatePaymentSchema.parse({
      params: { registration_id: "reg-1" },
      body: { paid: true },
    });
    expect(result.body.paid).toBe(true);
  });

  // Not z.coerce.boolean(), which would turn "false" and 0 into booleans and
  // silently mark someone paid on a typo'd request.
  test("rejects a stringified boolean", () => {
    expect(() =>
      updatePaymentSchema.parse({
        params: { registration_id: "reg-1" },
        body: { paid: "true" },
      }),
    ).toThrow();
  });

  test("rejects a missing paid flag", () => {
    expect(() =>
      updatePaymentSchema.parse({ params: { registration_id: "reg-1" }, body: {} }),
    ).toThrow();
  });
});
