import { Router } from "express";

import {
  getPaymentDetails,
  updatePaymentStatus,
  verifyPayments,
} from "../controllers/admin-payments.controller";
import { validate } from "../middlewares/validate";
import {
  getPaymentDetailsSchema,
  updatePaymentSchema,
} from "../validations/payment.validation";

export const adminPaymentsRouter = Router();

adminPaymentsRouter.post("/verify", verifyPayments);
adminPaymentsRouter.get("/:registration_id", validate(getPaymentDetailsSchema), getPaymentDetails);
adminPaymentsRouter.patch("/:registration_id", validate(updatePaymentSchema), updatePaymentStatus);
