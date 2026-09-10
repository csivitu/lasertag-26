import { responses } from "./shared";

export const teamPaths = {
  "/admin/teams/{team_id}": {
    get: {
      summary: "Get team detail",
      description:
        "Team members with payment and QR/check-in status, plus the slot booked for the team (found via the team leader's own booking), if any.",
      tags: ["Teams"],
      parameters: [
        {
          in: "path",
          name: "team_id",
          required: true,
          schema: { type: "string" },
          description: "teams.team_code",
        },
      ],
      responses: {
        200: { description: "Team detail" },
        400: responses.error("team_id is required"),
        401: responses.unauthorized,
        403: responses.forbidden,
        404: responses.error("Team not found"),
      },
    },
  },
};
