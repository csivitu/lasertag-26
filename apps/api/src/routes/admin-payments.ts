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

adminPaymentsRouter.post("/verify", verifyPayments);
// Verification-list writes stay super-admin only; reads keep the admin gate.
adminPaymentsRouter.get("/", listPayments);
adminPaymentsRouter.post("/import", requireSuperAdmin, paidListUpload, importPaidList);
adminPaymentsRouter.post(
  "/import-text",
  requireSuperAdmin,
  validate(pasteImportSchema),
  importPastedList,
);
adminPaymentsRouter.get("/allowlist", listAllowlist);
adminPaymentsRouter.get("/:registration_id", validate(getPaymentDetailsSchema), getPaymentDetails);
adminPaymentsRouter.patch("/:registration_id", validate(updatePaymentSchema), updatePaymentStatus);
