import { responses } from "./shared";

/**
 * Participant-facing endpoints carried over from `dev`: slot reservation, team
 * formation, profile, and admin verification/check-in scan.
 */
const ok = (description: string) => ({ description });

const pathParam = (name: string, description: string) => ({
  in: "path",
  name,
  required: true,
  schema: { type: "string" },
  description,
});

export const participantPaths = {
  "/slots": {
    get: {
      summary: "List bookable slots",
      tags: ["Slots"],
      security: [],
      responses: { 200: ok("All slots") },
    },
    post: {
      summary: "Create a slot",
      tags: ["Slots"],
      security: [],
      responses: { 201: ok("The created slot"), 400: responses.badRequest },
    },
  },
  "/slots/{slot_id}": {
    delete: {
      summary: "Delete a slot",
      tags: ["Slots"],
      security: [],
      parameters: [pathParam("slot_id", "slots.id")],
      responses: { 200: ok("Slot deleted"), 404: responses.error("Slot not found") },
    },
  },
  "/slots/{slot_id}/reserve": {
    post: {
      summary: "Reserve a slot",
      description:
        "type must be 'individual' or 'team'; team_code is required when type is 'team'.",
      tags: ["Slots"],
      security: [],
      parameters: [pathParam("slot_id", "slots.id")],
      responses: {
        201: ok("The created booking"),
        400: responses.badRequest,
        404: responses.error("Slot not found"),
        409: responses.error("Slot is full, or the user already has a booking"),
      },
    },
  },
  "/teams": {
    get: {
      summary: "Get all teams",
      tags: ["Teams"],
      security: [],
      responses: { 200: ok("All teams") },
    },
    post: {
      summary: "Create a team",
      tags: ["Teams"],
      security: [],
      responses: { 201: ok("The created team"), 400: responses.badRequest },
    },
  },
  "/teams/code/{code}": {
    get: {
      summary: "Look a team up by its code",
      tags: ["Teams"],
      security: [],
      parameters: [pathParam("code", "teams.team_code")],
      responses: { 200: ok("The team"), 404: responses.error("Team not found") },
    },
  },
  "/teams/{team_id}/join": {
    post: {
      summary: "Join a team",
      tags: ["Teams"],
      security: [],
      parameters: [pathParam("team_id", "teams.team_code")],
      responses: {
        200: ok("Joined"),
        400: responses.badRequest,
        404: responses.error("Team or user not found"),
      },
    },
  },
  "/teams/{team_id}/members": {
    get: {
      summary: "List a team's members",
      tags: ["Teams"],
      security: [],
      parameters: [pathParam("team_id", "teams.team_code")],
      responses: { 200: ok("Members"), 404: responses.error("Team not found") },
    },
  },
  "/teams/{team_id}/invite": {
    post: {
      summary: "Generate a team invite",
      tags: ["Teams"],
      security: [],
      parameters: [pathParam("team_id", "teams.team_code")],
      responses: { 200: ok("Invite"), 404: responses.error("Team not found") },
    },
  },
  "/teams/{team_id}/convert-to-solo": {
    post: {
      summary: "Convert a single-member team into a solo registration",
      tags: ["Teams"],
      security: [],
      parameters: [pathParam("team_id", "teams.team_code")],
      responses: {
        200: ok("Converted to solo"),
        400: responses.badRequest,
        403: responses.forbidden,
        404: responses.error("Team not found"),
      },
    },
  },
  "/verification/{registration_id}": {
    get: {
      summary: "Verify a registration",
      description: "Admin only - requires a signed-in admin session cookie.",
      tags: ["Verification"],
      parameters: [pathParam("registration_id", "bookings.id")],
      responses: {
        200: ok("Registration detail"),
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Registration not found"),
      },
    },
  },
  "/verification/check-in": {
    post: {
      summary: "Check a participant in",
      description: "Admin only — requires a signed-in admin session cookie.",
      tags: ["Verification"],
      responses: {
        200: ok("Checked in, or already checked in"),
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("User not found"),
      },
    },
  },
  "/users/me/profile": {
    get: {
      summary: "Get current user profile and active registration",
      tags: ["Users"],
      responses: {
        200: ok("User profile with active registration"),
        401: responses.unauthorized,
        404: responses.error("User not found"),
      },
    },
  },
  "/admin/checkin/scan": {
    post: {
      summary: "Scan QR token or registration ID to check in",
      description: "Admin only — scans QR token or booking ID to mark participant checked in.",
      tags: ["Admin Checkin"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["identifier"],
              properties: {
                identifier: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: ok("Check-in successful or already checked in"),
        400: responses.badRequest,
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Registration not found"),
      },
    },
  },
};
