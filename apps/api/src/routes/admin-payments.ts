import { Router } from "express";
import {
    verifyPayments,
    getPaymentDetails,
    updatePaymentStatus,
} from "../controllers/admin-payments.controller";

const router = Router();

router.post("/verify", verifyPayments);
router.get("/:registration_id", getPaymentDetails);
router.patch("/:registration_id", updatePaymentStatus);

export default router;