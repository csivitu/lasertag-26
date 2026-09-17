import type { Request, Response } from "express";
import multer from "multer";

import {
  countAllowlistEntries,
  isIdentityAllowlisted,
  listAllowlistEntries,
  paidImportQueries,
  paymentQueries,
  registrationQueries,
} from "../data/queries";
import { NotImplementedError, ValidationError } from "../errors";
import { makePaymentsService } from "../services/payments";
import { importVerifiedEntries, parsePaidList, parsePastedList } from "../services/paid-import";
import type {
  GetPaymentDetailsInput,
  PasteImportInput,
  UpdatePaymentInput,
} from "../validations/payment.validation";

const payments = makePaymentsService(paymentQueries);

/** In-memory upload: xlsx/xls/csv participant lists, 5MB cap. */
export const paidListUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!/\.(xlsx|xls|csv)$/i.test(file.originalname)) {
      cb(new ValidationError("Only .xlsx, .xls or .csv files are accepted."));
      return;
    }
    cb(null, true);
  },
}).single("file");

/** Waiting on the payment gateway's CSV format before this can do anything real. */
export const verifyPayments = async () => {
  throw new NotImplementedError("Payment verification is not implemented yet");
};

/**
 * Bulk-verifies participants from an uploaded xlsx/csv list.
 * Every row is stored in the verified-participants allowlist (skipped when
 * already there), and any already-signed-up match is flipped to paid.
 * Additive only: nothing is ever unmarked, updated, or deleted — already
 * listed rows are left untouched. `?dryRun=true` previews.
 */
export const importPaidList = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError("Attach the participant list as the 'file' field.");
  }

  const dryRun = req.query.dryRun === "true" || req.query.dryRun === "1";
  const rows = parsePaidList(req.file.buffer, req.file.originalname);
  const result = await importVerifiedEntries(rows, paidImportQueries, {
    dryRun,
    source: "import",
  });
  // Fresh total so the UI count updates in the same round-trip (best-effort:
  // a count failure must never fail the import itself).
  let totalVerified: number | undefined;
  try {
    totalVerified = await countAllowlistEntries();
  } catch {
    totalVerified = undefined;
  }

  res.json({
    message: dryRun ? "Dry run — nothing was written." : "Paid list imported.",
    dryRun,
    filename: req.file.originalname,
    totalVerified,
    ...result,
  });
};

/**
 * Same as the file import, but for a directly-pasted list — one reg number
 * or email per line (commas, semicolons and tabs split too). Tokens with "@"
 * count as emails, everything else as reg numbers.
 */
export const importPastedList = async (
  req: Request<unknown, unknown, PasteImportInput["body"]>,
  res: Response,
) => {
  const dryRun = req.query.dryRun === "true" || req.query.dryRun === "1";
  const rows = parsePastedList(req.body.text);
  const result = await importVerifiedEntries(rows, paidImportQueries, {
    dryRun,
    source: "paste",
  });
  let totalVerified: number | undefined;
  try {
    totalVerified = await countAllowlistEntries();
  } catch {
    totalVerified = undefined;
  }

  res.json({
    message: dryRun ? "Dry run — nothing was written." : "Pasted list imported.",
    dryRun,
    totalVerified,
    ...result,
  });
};

/**
 * Newest-first allowlist slice for the admin verification screen.
 * Supports `?q=` (reg number / email / name), `?limit=` (1–500) and
 * `?offset=`. Returns `{ data, total, limit, offset }` — `total` is the
 * DB-side count for `q`, so the UI total stays correct past the fetch cap.
 * Read-only and additive-safe: never mutates anything.
 */
export const listAllowlist = async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const [entries, total] = await Promise.all([
    listAllowlistEntries(limit, offset, q),
    countAllowlistEntries(q),
  ]);
  res.json({ data: entries, total, limit, offset });
};

/**
 * Payment list for the verification screen: one row per booking with the
 * owner's paid flag. (Signed-up users with no booking yet have nothing to
 * toggle — they're covered by the allowlist instead.)
 */
export const listPayments = async (_req: Request, res: Response) => {
  const rows = await registrationQueries.search({ limit: 200 });
  res.json(
    rows.map((r) => ({
      id: r.regNo,
      user_id: r.userId,
      name: r.name,
      email: r.email,
      paid: r.paid,
    })),
  );
};

/** Single-identity check used by the booking gate and the profile sync. */
export async function isIdentityVerified(
  regNumber: string | null,
  email: string | null,
): Promise<boolean> {
  return isIdentityAllowlisted(regNumber, email);
}

export const getPaymentDetails = async (
  req: Request<GetPaymentDetailsInput["params"]>,
  res: Response,
) => {
  res.json(await payments.getDetails(req.params.registration_id));
};

export const updatePaymentStatus = async (
  req: Request<UpdatePaymentInput["params"], unknown, UpdatePaymentInput["body"]>,
  res: Response,
) => {
  const { registration_id } = req.params;
  const user = await payments.updateStatus(registration_id, req.body.paid);
  res.json({
    message: "Payment status updated successfully",
    registrationId: registration_id,
    user,
  });
};
