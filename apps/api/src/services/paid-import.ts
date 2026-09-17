import * as XLSX from "xlsx";

import { ValidationError } from "../errors";

/** One normalized identity: a reg number and/or an email, plus an optional name. */
export interface VerifiedEntry {
  rowNumber: number;
  regNumber: string | null;
  email: string | null;
  name: string | null;
}

export interface VerifiedUser {
  id: string;
  paid: boolean;
}

export interface AllowlistEntry {
  id: string;
  regNumber: string | null;
  email: string | null;
}

/** Everything this service needs from the database, and nothing more. */
export interface VerifiedImportDeps {
  findUserByRegNumber(regNumber: string): Promise<VerifiedUser | undefined>;
  findUserByEmail(email: string): Promise<VerifiedUser | undefined>;
  setUserPaid(userId: string, paid: boolean): Promise<unknown>;
  findAllowlisted(
    regNumber: string | null,
    email: string | null,
  ): Promise<AllowlistEntry | undefined>;
  insertAllowlistEntry(entry: {
    regNumber: string | null;
    email: string | null;
    name: string | null;
    source: string;
  }): Promise<AllowlistEntry>;
}

export interface InvalidEntry {
  rowNumber: number;
  value: string | null;
  name: string | null;
  reason: string;
}

/** A row that could not be stored/marked despite retries — never aborts the run. */
export interface FailedEntry {
  rowNumber: number;
  value: string | null;
  name: string | null;
  reason: string;
}

export interface VerifiedImportResult {
  total: number;
  /** New rows stored in the allowlist (skipped when dry-running). */
  allowlisted: number;
  /** Rows already present in the allowlist — skipped, never duplicated. */
  alreadyListed: number;
  /** Signed-up users flipped to paid by this import. */
  newlyPaid: number;
  /** Signed-up users that were already paid. */
  alreadyPaid: number;
  invalid: InvalidEntry[];
  /** Rows that failed with a DB error (isolated — the rest still applied). */
  failed: FailedEntry[];
}

/** Hard cap so a bad upload can't spin the server. */
const MAX_ROWS = 5000;

/** Pasted lists may separate values with newlines, commas, semicolons or tabs. */
const PASTE_SPLIT = /[\r\n,;\t]+/;

/** Header text normalized the same way on both sides of the lookup. */
function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const REG_NUMBER_HEADERS = new Set([
  "regnumber",
  "regno",
  "registrationnumber",
  "registrationno",
  "registernumber",
  "reg",
  "rollnumber",
  "rollno",
  "universityregno",
  "vitregno",
  "regn",
]);

const EMAIL_HEADERS = new Set(["email", "emailid", "emailaddress", "mail"]);

const NAME_HEADERS = new Set([
  "name",
  "fullname",
  "playername",
  "participant",
  "participantname",
]);

/** VIT reg numbers are user-typed at onboarding — compare case-insensitively. */
export function normalizeRegNumber(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim().replace(/\s+/g, " ").toUpperCase();
  return cleaned.length > 0 ? cleaned : null;
}

export function normalizeEmail(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim().toLowerCase();
  if (cleaned.length === 0 || !cleaned.includes("@")) return null;
  return cleaned;
}

function normalizeName(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim().replace(/\s+/g, " ");
  return cleaned.length > 0 ? cleaned : null;
}

/** A pasted token carrying "@" is an email, anything else a reg number. */
function classifyToken(token: string, rowNumber: number): VerifiedEntry | null {
  const trimmed = token.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.includes("@")) {
    const email = normalizeEmail(trimmed);
    if (!email) return null;
    return { rowNumber, regNumber: null, email, name: null };
  }
  const regNumber = normalizeRegNumber(trimmed);
  if (!regNumber) return null;
  return { rowNumber, regNumber, email: null, name: null };
}

function cell(row: unknown[], index: number): unknown {
  return index >= 0 && index < row.length ? row[index] : null;
}

/**
 * Reads the first sheet of an xlsx/xls/csv buffer into normalized entries.
 * The first non-empty row is treated as the header row. Name is typically
 * column 1 with "Reg No" as column 2, but any column order works.
 *
 * @throws ValidationError when no reg-number or email column can be found.
 */
export function parsePaidList(buffer: Buffer, filename: string): VerifiedEntry[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    throw new ValidationError(
      `Could not read "${filename}". Upload a valid .xlsx, .xls or .csv file.`,
    );
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new ValidationError(`"${filename}" has no sheets to read.`);
  }

  const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: null,
    blankrows: false,
  });

  const headerIndex = grid.findIndex(
    (row) => Array.isArray(row) && row.some((c) => c !== null && String(c).trim() !== ""),
  );
  if (headerIndex === -1) {
    throw new ValidationError(`"${filename}" is empty.`);
  }

  const headers = (grid[headerIndex] as unknown[]).map(normalizeHeader);
  const regIdx = headers.findIndex((h) => REG_NUMBER_HEADERS.has(h));
  const emailIdx = headers.findIndex((h) => EMAIL_HEADERS.has(h));
  const nameIdx = headers.findIndex((h) => NAME_HEADERS.has(h));

  if (regIdx === -1 && emailIdx === -1) {
    throw new ValidationError(
      'Could not find a registration-number or email column. Expected a header like "Reg No" and/or "Email".',
    );
  }

  const rows: VerifiedEntry[] = [];
  for (let i = headerIndex + 1; i < grid.length; i++) {
    const raw = grid[i];
    if (!Array.isArray(raw)) continue;
    const regNumber = regIdx === -1 ? null : normalizeRegNumber(cell(raw, regIdx));
    const email = emailIdx === -1 ? null : normalizeEmail(cell(raw, emailIdx));
    const name = nameIdx === -1 ? null : normalizeName(cell(raw, nameIdx));
    if (regNumber === null && email === null && name === null) continue;
    rows.push({ rowNumber: i + 1, regNumber, email, name });
    if (rows.length > MAX_ROWS) {
      throw new ValidationError(`Too many rows (max ${MAX_ROWS}). Split the file and retry.`);
    }
  }

  if (rows.length === 0) {
    throw new ValidationError(`"${filename}" has no participant rows below the header.`);
  }
  return rows;
}

/**
 * Parses a directly-pasted list (one value per line; commas, semicolons and
 * tabs also split) into normalized entries. No file needed.
 *
 * @throws ValidationError when nothing usable was pasted.
 */
export function parsePastedList(text: string): VerifiedEntry[] {
  const entries: VerifiedEntry[] = [];
  const tokens = text.split(PASTE_SPLIT);
  for (let i = 0; i < tokens.length; i++) {
    const entry = classifyToken(tokens[i], i + 1);
    if (entry) entries.push(entry);
    if (entries.length > MAX_ROWS) {
      throw new ValidationError(`Too many values (max ${MAX_ROWS}). Split and retry.`);
    }
  }
  if (entries.length === 0) {
    throw new ValidationError("Nothing usable pasted — add reg numbers or emails, one per line.");
  }
  return entries;
}

/**
 * Stores every entry in the verified-participants allowlist (skipping ones
 * already there) and flips any already-signed-up matching user to paid.
 * Additive only: nothing is ever unmarked or deleted, and existing rows are
 * never updated — if already listed, the row is left untouched.
 *
 * Row-by-row and fault-isolated: each row is verified individually and a
 * single DB error lands in `failed` while the rest of the run continues, so
 * a 300+ row upload always applies every storable row.
 */
export async function importVerifiedEntries(
  rows: VerifiedEntry[],
  deps: VerifiedImportDeps,
  options: { dryRun: boolean; source: string },
): Promise<VerifiedImportResult> {
  const result: VerifiedImportResult = {
    total: rows.length,
    allowlisted: 0,
    alreadyListed: 0,
    newlyPaid: 0,
    alreadyPaid: 0,
    invalid: [],
    failed: [],
  };

  // In-file dedupe: same normalized identity twice in one upload counts the
  // second as already-listed without extra DB round-trips or double paid flips.
  const seenInFile = new Set<string>();

  for (const row of rows) {
    // Defensive re-normalize: entries normally arrive normalized from the
    // parsers, but each row is verified on its own so casing/whitespace can
    // never split one identity into two.
    const regNumber = normalizeRegNumber(row.regNumber);
    const email = normalizeEmail(row.email);
    if (regNumber === null && email === null) {
      result.invalid.push({
        rowNumber: row.rowNumber,
        value: row.name,
        name: row.name,
        reason: "Row has neither a registration number nor an email.",
      });
      continue;
    }

    const identityKey = regNumber
      ? `REG:${regNumber}`
      : `EMAIL:${email}`;
    if (seenInFile.has(identityKey)) {
      result.alreadyListed += 1;
      continue;
    }

    try {
      const listed = await deps.findAllowlisted(regNumber, email);
      if (listed) {
        result.alreadyListed += 1;
        seenInFile.add(identityKey);
      } else if (!options.dryRun) {
        await deps.insertAllowlistEntry({
          regNumber,
          email,
          name: row.name,
          source: options.source,
        });
        result.allowlisted += 1;
        seenInFile.add(identityKey);
      } else {
        result.allowlisted += 1;
        seenInFile.add(identityKey);
      }

      let found: VerifiedUser | undefined;
      if (regNumber) {
        found = await deps.findUserByRegNumber(regNumber);
      }
      if (!found && email) {
        found = await deps.findUserByEmail(email);
      }
      if (!found) continue;

      if (found.paid) {
        result.alreadyPaid += 1;
        continue;
      }
      if (!options.dryRun) {
        await deps.setUserPaid(found.id, true);
      }
      result.newlyPaid += 1;
    } catch (err) {
      // Isolate this row — everything else in the upload still applies.
      result.failed.push({
        rowNumber: row.rowNumber,
        value: regNumber ?? email,
        name: row.name,
        reason: err instanceof Error ? err.message : "Row failed to store.",
      });
    }
  }

  return result;
}
