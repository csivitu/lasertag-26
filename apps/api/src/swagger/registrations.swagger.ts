import { responses } from "./shared";

const filter = (name: string, description: string) => ({
  in: "query",
  name,
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
};
