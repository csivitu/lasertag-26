import {
  slotInputSchema,
  slotPatchSchema,
  slotResponseSchema,
} from "../validations/slot.validation";
import { responses, toSchema } from "./shared";

export const slotSchemas = {
  Slot: toSchema(slotResponseSchema),
  SlotInput: toSchema(slotInputSchema),
  SlotPatch: toSchema(slotPatchSchema),
};

const slotIdParam = {
  in: "path",
  name: "slot_id",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const slotArray = { type: "array", items: { $ref: "#/components/schemas/Slot" } };

export const slotPaths = {
  "/admin/slots": {
    get: {
      summary: "List all slots",
      tags: ["Slots"],
      responses: {
        200: { description: "Array of slots", content: { "application/json": { schema: slotArray } } },
        401: responses.unauthorized,
        403: responses.forbidden,
      },
    },
    post: {
      summary: "Create one slot",
      tags: ["Slots"],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/SlotInput" } } },
      },
      responses: {
        201: {
          description: "The created slot",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Slot" } } },
        },
        400: responses.badRequest,
        401: responses.unauthorized,
        403: responses.forbidden,
      },
    },
  },
  "/admin/slots/bulk": {
    post: {
      summary: "Create multiple slots",
      tags: ["Slots"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { type: "array", items: { $ref: "#/components/schemas/SlotInput" } },
          },
        },
      },
      responses: {
        201: { description: "The created slots", content: { "application/json": { schema: slotArray } } },
        400: responses.error(
          "Invalid input — non-empty array required, every slot validated the same as single-create",
        ),
        401: responses.unauthorized,
        403: responses.forbidden,
      },
    },
  },
  "/admin/slots/{slot_id}": {
    patch: {
      summary: "Edit a slot",
      tags: ["Slots"],
      parameters: [slotIdParam],
      requestBody: {
        required: true,
        description: "Any subset of fields; only the given ones change.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/SlotPatch" } } },
      },
      responses: {
        200: {
          description: "The updated slot",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Slot" } } },
        },
        400: responses.error("Invalid slot_id or field values"),
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Slot not found"),
        409: {
          description: "capacity would drop below the slot's current booking count",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Conflict" } } },
        },
      },
    },
    delete: {
      summary: "Delete a slot",
      tags: ["Slots"],
      parameters: [slotIdParam],
      responses: {
        204: { description: "Slot deleted" },
        400: responses.error("slot_id is not a valid UUID"),
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Slot not found"),
        409: {
          description: "Slot has existing bookings",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Conflict" } } },
        },
      },
    },
  },
  "/admin/slots/{slot_id}/bookings": {
    get: {
      summary: "List all bookings and users for a slot",
      tags: ["Slots"],
      parameters: [slotIdParam],
      responses: {
        200: {
          description: "Slot details with participant list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  slot: { $ref: "#/components/schemas/Slot" },
                  bookings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        bookingId: { type: "string" },
                        type: { type: "string" },
                        status: { type: "string" },
                        teamCode: { type: "string", nullable: true },
                        confirmedAt: { type: "string", format: "date-time", nullable: true },
                        isCheckedIn: { type: "boolean" },
                        checkedInAt: { type: "string", format: "date-time", nullable: true },
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string" },
                            regNumber: { type: "string", nullable: true },
                            phNumber: { type: "string", nullable: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: responses.error("slot_id is not a valid UUID"),
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Slot not found"),
      },
    },
  },
};

