import { Router } from "express";

import { paymentQueries } from "../data/queries";
import { registrationIdParamsSchema, updatePaymentSchema } from "../schemas/payments";
import { makePaymentsService } from "../services/payments";

const payments = makePaymentsService(paymentQueries);

export const paymentsRouter = Router();

// Waiting on the payment CSV format from the payment gateway before this can
// do anything real; stubbed so the route exists and returns a clear status
// instead of a bare 404.
paymentsRouter.post("/verify", async (_req, res) => {
  res.status(501).json({
    error: "Payment verification is not implemented yet",
    code: "not_implemented",
  });
});

paymentsRouter.get("/:registration_id", async (req, res) => {
  const { registration_id } = registrationIdParamsSchema.parse(req.params);
  res.json(await payments.getDetails(registration_id));
});

paymentsRouter.patch("/:registration_id", async (req, res) => {
  const { registration_id } = registrationIdParamsSchema.parse(req.params);
  const { paid } = updatePaymentSchema.parse(req.body);
  const updatedUser = await payments.updateStatus(registration_id, paid);
  res.json({
    message: "Payment status updated successfully",
    registrationId: registration_id,
    user: updatedUser,
  });
});
