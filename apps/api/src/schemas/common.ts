import { z } from "zod";

/** `teams.team_code` is a free-form text primary key, so only non-blank is enforced. */
export const teamIdParamsSchema = z.object({
  team_id: z.string().trim().min(1, "team_id is required"),
});
