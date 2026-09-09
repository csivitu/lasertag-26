import {
  paymentDetailResponseSchema,
  updatePaymentResponseSchema,
  updatePaymentSchema,
} from "../validations/payment.validation";
import { responses, toSchema } from "./shared";

export const paymentSchemas = {
  PaymentDetail: toSchema(paymentDetailResponseSchema),
  PaymentPatch: toSchema(updatePaymentSchema.shape.body),
  PaymentUpdateResponse: toSchema(updatePaymentResponseSchema),
};

const registrationIdParam = {
  in: "path",
  name: "registration_id",
  required: true,
  schema: { type: "string" },
  description: "bookings.id",
};

export const paymentPaths = {
  "/admin/payments/verify": {
    post: {
      summary: "Bulk-verify payments",
      description: "Not implemented yet — waiting on the payment gateway's CSV format.",
      tags: ["Payments"],
      responses: {
        401: responses.unauthorized,
        403: responses.forbidden,
        501: responses.error("Not implemented"),
      },
    },
  },
  "/admin/payments/{registration_id}": {
    get: {
      summary: "Get payment detail for a registration",
      tags: ["Payments"],
      parameters: [registrationIdParam],
      responses: {
        200: {
          description: "Payment detail",
          content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentDetail" } } },
        },
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Registration not found"),
      },
    },
    patch: {
      summary: "Set a registration's payment status",
      description: "Updates the paid flag on the booking's user, not the booking itself.",
      tags: ["Payments"],
      parameters: [registrationIdParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentPatch" } } },
      },
      responses: {
        200: {
          description: "The updated user's payment status",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/PaymentUpdateResponse" } },
          },
        },
        400: responses.error("Invalid registration_id or paid value"),
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Registration not found"),
      },
    },
  },
};
