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
  "/admin/payments": {
    get: {
      summary: "List payment rows for the verification screen",
      description: "One row per booking with the owner's paid flag.",
      tags: ["Payments"],
      responses: {
        200: {
          description: "Payment rows",
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
        401: responses.unauthorized,
        403: responses.forbidden,
      },
    },
  },
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
  "/admin/payments/import": {
    post: {
      summary: "Bulk-verify participants from an xlsx/csv list",
      description:
        "Multipart upload (field 'file'). Every row is stored in the verified-participants allowlist (reg number first, email fallback) and signed-up matches are flipped to paid. Additive only. ?dryRun=true previews without writing. Super admin only.",
      tags: ["Payments"],
      responses: {
        200: {
          description: "Import summary with allowlisted / paid / invalid counts",
          content: { "application/json": { schema: { type: "object" } } },
        },
        400: responses.error("Unreadable file, missing columns, or no file attached"),
        401: responses.unauthorized,
        403: responses.forbidden,
      },
    },
  },
  "/admin/payments/import-text": {
    post: {
      summary: "Bulk-verify participants from a pasted list",
      description:
        "JSON body { text } — one reg number or email per line (commas, semicolons, tabs split too). Same allowlist + paid semantics as the file import. Super admin only.",
      tags: ["Payments"],
      responses: {
        200: {
          description: "Import summary with allowlisted / paid / invalid counts",
          content: { "application/json": { schema: { type: "object" } } },
        },
        400: responses.error("Empty or oversized pasted list"),
        401: responses.unauthorized,
        403: responses.forbidden,
      },
    },
  },
  "/admin/payments/allowlist": {
    get: {
      summary: "List verified-participant allowlist entries",
      description: "Newest first, capped at 500 rows.",
      tags: ["Payments"],
      responses: {
        200: {
          description: "Allowlist entries",
          content: { "application/json": { schema: { type: "object" } } },
        },
        401: responses.unauthorized,
        403: responses.forbidden,
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
