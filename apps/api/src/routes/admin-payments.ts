import { Router } from "express";
import {
    verifyPayments,
    getPaymentDetails,
    updatePaymentStatus,
} from "../controllers/admin-payments.controller";
import { validate } from "../middleware/validate";
import {
    getPaymentDetailsSchema,
    updatePaymentSchema,
} from "../validations/payment.validation";

const router = Router();

router.post("/verify", verifyPayments);
router.get("/:registration_id", validate(getPaymentDetailsSchema), getPaymentDetails);
router.patch("/:registration_id", validate(updatePaymentSchema), updatePaymentStatus);

export default router;