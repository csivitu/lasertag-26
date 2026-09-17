import { Router } from "express";

import {
  getPaymentDetails,
  importPaidList,
  importPastedList,
  listAllowlist,
  listPayments,
  paidListUpload,
  updatePaymentStatus,
  verifyPayments,
} from "../controllers/admin-payments.controller";
import { requireSuperAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  getPaymentDetailsSchema,
  pasteImportSchema,
  updatePaymentSchema,
} from "../validations/payment.validation";

export const adminPaymentsRouter = Router();

adminPaymentsRouter.post("/verify", requireSuperAdmin, verifyPayments);
// Verification workstation is super-admin only (reads and writes).
adminPaymentsRouter.get("/", requireSuperAdmin, listPayments);
adminPaymentsRouter.post("/import", requireSuperAdmin, paidListUpload, importPaidList);
adminPaymentsRouter.post(
  "/import-text",
  requireSuperAdmin,
  validate(pasteImportSchema),
  importPastedList,
);
adminPaymentsRouter.get("/allowlist", requireSuperAdmin, listAllowlist);
adminPaymentsRouter.get("/:registration_id", requireSuperAdmin, validate(getPaymentDetailsSchema), getPaymentDetails);
adminPaymentsRouter.patch("/:registration_id", requireSuperAdmin, validate(updatePaymentSchema), updatePaymentStatus);
