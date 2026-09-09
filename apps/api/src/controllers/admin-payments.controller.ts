import type { Request, Response } from "express";

import { paymentQueries } from "../data/queries";
import { NotImplementedError } from "../errors";
import { makePaymentsService } from "../services/payments";
import type {
  GetPaymentDetailsInput,
  UpdatePaymentInput,
} from "../validations/payment.validation";

const payments = makePaymentsService(paymentQueries);

/** Waiting on the payment gateway's CSV format before this can do anything real. */
export const verifyPayments = async () => {
  throw new NotImplementedError("Payment verification is not implemented yet");
};

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
