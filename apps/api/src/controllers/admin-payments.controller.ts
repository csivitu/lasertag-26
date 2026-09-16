import type { Request, Response } from "express";
import { db } from "@lasertag-26/database";
import { bookings, user } from "@lasertag-26/database/schema";
import { eq } from "drizzle-orm";

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

export const listPayments = async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      id: bookings.id,
      user_id: user.id,
      name: user.name,
      email: user.email,
      paid: user.paid,
      date: bookings.confirmedAt,
      type: bookings.type,
      teamCode: bookings.teamCode,
    })
    .from(bookings)
    .innerJoin(user, eq(bookings.userId, user.id));

  const formatted = rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    name: r.name,
    email: r.email,
    amount: 500,
    paid: r.paid,
    date: r.date ? new Date(r.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  }));

  res.json(formatted);
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
  const updatedUser = await payments.updateStatus(registration_id, req.body.paid);
  res.json({
    message: "Payment status updated successfully",
    registrationId: registration_id,
    user: updatedUser,
  });
};
