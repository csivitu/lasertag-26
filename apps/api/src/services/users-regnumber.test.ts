import { describe, expect, test } from "bun:test";

import { ConflictError } from "../errors";
import { resolveRegNumberUpdate } from "./users";

describe("resolveRegNumberUpdate", () => {
  test("first save from empty accepts anything", () => {
    expect(resolveRegNumberUpdate(null, "a@vitstudent.ac.in", "23bce1234")).toBe("23BCE1234");
    expect(resolveRegNumberUpdate("", "x@gmail.com", "N/A")).toBe("N/A");
  });

  test("undefined input stays undefined", () => {
    expect(resolveRegNumberUpdate("23BCE1234", "a@vitstudent.ac.in", undefined)).toBeUndefined();
  });

  test("locked reg rejects changes", () => {
    expect(() =>
      resolveRegNumberUpdate("23BCE1234", "a@vitstudent.ac.in", "23BCE9999"),
    ).toThrow(ConflictError);
  });

  test("locked reg accepts the same value", () => {
    expect(resolveRegNumberUpdate("23BCE1234", "a@vitstudent.ac.in", "23bce1234")).toBe(
      "23BCE1234",
    );
  });

  test("N/A upgrades to a real reg", () => {
    expect(resolveRegNumberUpdate("N/A", "x@gmail.com", "23BCE1234")).toBe("23BCE1234");
  });

  test("N/A stays N/A for externals", () => {
    expect(resolveRegNumberUpdate("N/A", "x@gmail.com", "n/a")).toBe("N/A");
  });

  test("VIT emails cannot take N/A", () => {
    expect(() => resolveRegNumberUpdate(null, "a@vitstudent.ac.in", "N/A")).toThrow(
      ConflictError,
    );
    expect(() => resolveRegNumberUpdate("N/A", "A@VITSTUDENT.AC.IN", "n/a")).toThrow(
      ConflictError,
    );
  });
});
