import { describe, expect, mock, test } from "bun:test";
import * as XLSX from "xlsx";

import { ValidationError } from "../errors";
import {
  importVerifiedEntries,
  normalizeEmail,
  normalizeRegNumber,
  parsePaidList,
  parsePastedList,
  type VerifiedImportDeps,
  type VerifiedEntry,
} from "./paid-import";

function buildSheet(rows: unknown[][]): Buffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Participants");
  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

function makeDeps(overrides: Partial<VerifiedImportDeps> = {}): VerifiedImportDeps {
  return {
    findUserByRegNumber: mock(async () => undefined),
    findUserByEmail: mock(async () => undefined),
    setUserPaid: mock(async () => ({})),
    findAllowlisted: mock(async () => undefined),
    insertAllowlistEntry: mock(async (entry: {
      regNumber: string | null;
      email: string | null;
      name: string | null;
      source: string;
    }) => ({ id: "allow-1", regNumber: entry.regNumber, email: entry.email })),
    ...overrides,
  };
}

describe("normalizeRegNumber", () => {
  test("trims and uppercases for case-insensitive matching", () => {
    expect(normalizeRegNumber("  23bce1234 ")).toBe("23BCE1234");
  });

  test("returns null for blank values", () => {
    expect(normalizeRegNumber("")).toBeNull();
    expect(normalizeRegNumber(null)).toBeNull();
    expect(normalizeRegNumber(undefined)).toBeNull();
  });
});

describe("normalizeEmail", () => {
  test("trims and lowercases", () => {
    expect(normalizeEmail("  Player@VITStudent.AC.IN ")).toBe("player@vitstudent.ac.in");
  });

  test("returns null for blank or non-email values", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("parsePaidList", () => {
  test("reads name col 1 + precise 'Reg No' col 2", () => {
    const rows = parsePaidList(
      buildSheet([
        ["Name", "Reg No"],
        ["Alicia Rao", "23bce1234"],
        ["Ben Shah", "23BCE5678"],
      ]),
      "paid.xlsx",
    );

    expect(rows).toEqual([
      { rowNumber: 2, regNumber: "23BCE1234", email: null, name: "Alicia Rao" },
      { rowNumber: 3, regNumber: "23BCE5678", email: null, name: "Ben Shah" },
    ]);
  });

  test("accepts header variants and skips empty rows", () => {
    const rows = parsePaidList(
      buildSheet([
        ["Registration Number", "Email ID"],
        ["23BCE1234", "a@vitstudent.ac.in"],
        [null, null],
        ["", ""],
      ]),
      "paid.xlsx",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].regNumber).toBe("23BCE1234");
  });

  test("works with an email-only sheet", () => {
    const rows = parsePaidList(
      buildSheet([["Email"], ["a@vitstudent.ac.in"]]),
      "paid.csv",
    );

    expect(rows).toEqual([
      { rowNumber: 2, regNumber: null, email: "a@vitstudent.ac.in", name: null },
    ]);
  });

  test("rejects a sheet with no usable identifier column", () => {
    expect(() =>
      parsePaidList(buildSheet([["Name", "Phone"], ["Alicia", "99999"]]), "paid.xlsx"),
    ).toThrow(ValidationError);
  });

  test("rejects garbage buffers", () => {
    expect(() => parsePaidList(Buffer.from([0x00, 0x01, 0x02]), "paid.xlsx")).toThrow(
      ValidationError,
    );
  });
});

describe("parsePastedList", () => {
  test("classifies reg numbers and emails across lines, commas and tabs", () => {
    const rows = parsePastedList("23bce1234\na@vitstudent.ac.in, 23BCE5678;\tb@vitstudent.ac.in");

    expect(rows).toEqual([
      { rowNumber: 1, regNumber: "23BCE1234", email: null, name: null },
      { rowNumber: 2, regNumber: null, email: "a@vitstudent.ac.in", name: null },
      { rowNumber: 3, regNumber: "23BCE5678", email: null, name: null },
      { rowNumber: 4, regNumber: null, email: "b@vitstudent.ac.in", name: null },
    ]);
  });

  test("skips blank lines", () => {
    const rows = parsePastedList("\n  \n23BCE1234\n\n");
    expect(rows).toHaveLength(1);
  });

  test("rejects empty pastes", () => {
    expect(() => parsePastedList("   \n , ; ")).toThrow(ValidationError);
  });
});

describe("importVerifiedEntries", () => {
  const rows: VerifiedEntry[] = [
    { rowNumber: 2, regNumber: "23BCE1234", email: "a@vitstudent.ac.in", name: "Alicia" },
    { rowNumber: 3, regNumber: "23BCE9999", email: "ghost@vitstudent.ac.in", name: "Ghost" },
  ];

  test("allowists unknown identities and marks signed-up matches paid", async () => {
    const deps = makeDeps({
      findUserByRegNumber: mock(async (reg: string) =>
        reg === "23BCE1234" ? { id: "user-1", paid: false } : undefined,
      ),
    });
    const result = await importVerifiedEntries(rows, deps, { dryRun: false, source: "import" });

    expect(deps.insertAllowlistEntry).toHaveBeenCalledTimes(2);
    expect(deps.setUserPaid).toHaveBeenCalledWith("user-1", true);
    expect(result).toMatchObject({ total: 2, allowlisted: 2, alreadyListed: 0, newlyPaid: 1 });
    expect(result.invalid).toHaveLength(0);
  });

  test("skips already-allowlisted identities without duplicating", async () => {
    const deps = makeDeps({
      findAllowlisted: mock(async () => ({ id: "allow-9", regNumber: "23BCE1234", email: null })),
      findUserByRegNumber: mock(async () => ({ id: "user-1", paid: true })),
    });
    const result = await importVerifiedEntries(rows.slice(0, 1), deps, {
      dryRun: false,
      source: "import",
    });

    expect(deps.insertAllowlistEntry).not.toHaveBeenCalled();
    expect(deps.setUserPaid).not.toHaveBeenCalled();
    expect(result).toMatchObject({ alreadyListed: 1, alreadyPaid: 1, newlyPaid: 0 });
  });

  test("dry run reports without writing anything", async () => {
    const deps = makeDeps({
      findUserByRegNumber: mock(async () => ({ id: "user-1", paid: false })),
    });
    const result = await importVerifiedEntries(rows.slice(0, 1), deps, {
      dryRun: true,
      source: "paste",
    });

    expect(deps.insertAllowlistEntry).not.toHaveBeenCalled();
    expect(deps.setUserPaid).not.toHaveBeenCalled();
    expect(result).toMatchObject({ allowlisted: 1, newlyPaid: 1 });
  });

  test("flags rows with neither identifier as invalid", async () => {
    const deps = makeDeps();
    const result = await importVerifiedEntries(
      [{ rowNumber: 7, regNumber: null, email: null, name: "Nobody" }],
      deps,
      { dryRun: false, source: "paste" },
    );

    expect(result.invalid).toHaveLength(1);
    expect(deps.insertAllowlistEntry).not.toHaveBeenCalled();
  });

  test("dedupes repeated identities within one upload without extra writes", async () => {
    const deps = makeDeps();
    const dupes: VerifiedEntry[] = [
      { rowNumber: 2, regNumber: "23BCE1234", email: null, name: "Alicia" },
      { rowNumber: 3, regNumber: "23bce1234", email: null, name: "Alicia again" },
      { rowNumber: 4, regNumber: "23BCE1234", email: null, name: "Alicia third" },
    ];
    const result = await importVerifiedEntries(dupes, deps, { dryRun: false, source: "import" });

    expect(deps.insertAllowlistEntry).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ total: 3, allowlisted: 1, alreadyListed: 2 });
    expect(result.failed).toHaveLength(0);
  });

  test("isolates a single-row DB failure — the rest of the upload still applies", async () => {
    const deps = makeDeps({
      insertAllowlistEntry: mock(async (entry: {
        regNumber: string | null;
        email: string | null;
        name: string | null;
        source: string;
      }) => {
        if (entry.regNumber === "23BCEBAD") throw new Error("boom");
        return { id: "allow-1", regNumber: entry.regNumber, email: entry.email };
      }),
    });
    const mixed: VerifiedEntry[] = [
      { rowNumber: 2, regNumber: "23BCE0001", email: null, name: "Good One" },
      { rowNumber: 3, regNumber: "23BCEBAD", email: null, name: "Bad Row" },
      { rowNumber: 4, regNumber: "23BCE0002", email: null, name: "Good Two" },
    ];
    const result = await importVerifiedEntries(mixed, deps, { dryRun: false, source: "import" });

    expect(result).toMatchObject({ total: 3, allowlisted: 2 });
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({ rowNumber: 3, value: "23BCEBAD" });
  });

  test("re-uploading the same list stores nothing new (additive only)", async () => {
    const deps = makeDeps({
      findAllowlisted: mock(async () => ({ id: "allow-9", regNumber: "23BCE1234", email: null })),
      findUserByRegNumber: mock(async () => ({ id: "user-1", paid: true })),
    });
    const same: VerifiedEntry[] = [
      { rowNumber: 2, regNumber: "23BCE1234", email: null, name: "Alicia" },
      { rowNumber: 3, regNumber: "23BCE1234", email: null, name: "Alicia" },
    ];
    const result = await importVerifiedEntries(same, deps, { dryRun: false, source: "import" });

    expect(deps.insertAllowlistEntry).not.toHaveBeenCalled();
    expect(deps.setUserPaid).not.toHaveBeenCalled();
    expect(result).toMatchObject({ allowlisted: 0, alreadyListed: 2, newlyPaid: 0 });
    expect(result.failed).toHaveLength(0);
  });
});
