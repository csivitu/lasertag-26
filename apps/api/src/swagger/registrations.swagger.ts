import { responses } from "./shared";

const filter = (name: string, description: string) => ({
  in: "query",
  name,
  schema: { type: "string" },
  description,
});

const pathParam = (name: string, description: string) => ({
  in: "path",
  name,
  required: true,
  schema: { type: "string" },
  description,
});

export const registrationPaths = {
  "/admin/registrations": {
    get: {
      summary: "Search registrations",
      description:
        "A 'registration' is a booking. All query params are optional and combined with AND; reg_no matches bookings.id exactly, the rest are case-insensitive substring matches against the booking's user. No params returns every registration.",
      tags: ["Registrations"],
      parameters: [
        filter("reg_no", "Exact bookings.id"),
        filter("name", "Substring match on user.name"),
        filter("phone", "Substring match on user.ph_number"),
        filter("email", "Substring match on user.email"),
      ],
      responses: {
        200: { description: "Matching registrations (empty array if nothing matches)" },
        401: responses.unauthorized,
        403: responses.forbidden,
      },
    },
  },
  "/registrations/solo": {
    post: {
      summary: "Create solo registration",
      description: "Create a new solo (individual) registration for a slot for the authenticated user.",
      tags: ["Registrations"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["slot_id"],
              properties: {
                slot_id: { type: "string", format: "uuid" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Solo registration created successfully" },
        400: responses.badRequest,
        401: responses.unauthorized,
        404: responses.error("Slot or user not found"),
        409: responses.error("Slot is full or user already has an active registration"),
      },
    },
  },
  "/registrations/{reservation_id}/confirm": {
    post: {
      summary: "Confirm a registration",
      description: "Confirm a reservation and generate a QR token.",
      tags: ["Registrations"],
      parameters: [pathParam("reservation_id", "Reservation / Booking ID")],
      responses: {
        200: { description: "Registration confirmed successfully" },
        400: responses.badRequest,
        404: responses.error("Registration not found"),
        409: responses.error("Cannot confirm a cancelled registration"),
      },
    },
  },
  "/registrations/{reservation_id}": {
    get: {
      summary: "Get registration details",
      description: "Retrieve registration details by reservation_id for owner or admin.",
      tags: ["Registrations"],
      parameters: [pathParam("reservation_id", "Reservation / Booking ID")],
      responses: {
        200: { description: "Registration details" },
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Registration not found"),
      },
    },
    delete: {
      summary: "Cancel a registration",
      description: "Cancel a registration for owner or admin.",
      tags: ["Registrations"],
      parameters: [pathParam("reservation_id", "Reservation / Booking ID")],
      responses: {
        200: { description: "Registration cancelled successfully" },
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Registration not found"),
        409: responses.error("Registration is already cancelled or user has checked in"),
      },
    },
  },
  "/registrations/{reservation_id}/qr": {
    get: {
      summary: "Get registration QR token",
      description: "Retrieve QR token for a confirmed registration for owner or admin.",
      tags: ["Registrations"],
      parameters: [pathParam("reservation_id", "Reservation / Booking ID")],
      responses: {
        200: { description: "QR token details" },
        400: responses.badRequest,
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Registration not found"),
        409: responses.error("Cannot retrieve QR for a cancelled registration"),
      },
    },
  },
};
