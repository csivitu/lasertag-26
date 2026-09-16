import { z } from "zod";

/** `teams.team_code` is a free-form text primary key, so only non-blank is enforced. */
export const teamIdSchema = z.object({
  params: z.object({
    team_id: z.string().trim().min(1, "team_id is required"),
  }),
});

/** Participant-facing team schemas. */
export const createTeamSchema = z.object({
  body: z.object({
    leader_id: z
      .string()
      .trim()
      .min(1, "leader_id and team_code are required fields."),
    team_code: z
      .string()
      .trim()
      .min(1, "leader_id and team_code are required fields."),
    name: z.string().trim().optional(),
    members: z.number().int().positive().optional(),
    regNo: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    fullName: z.string().trim().optional(),
  }),
});

export const getTeamByCodeSchema = z.object({
  params: z.object({
    code: z.string().trim().min(1, "Team code is required."),
  }),
});

export const joinTeamSchema = z.object({
  params: z.object({
    team_id: z.string().trim().min(1, "team_id is required in path."),
  }),
  body: z.object({
    user_id: z.string().trim().min(1, "user_id is required in body."),
    regNo: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    fullName: z.string().trim().optional(),
  }),
});

export const convertToSoloSchema = z.object({
  params: z
    .object({
      team_id: z.string().trim().optional(),
    })
    .optional(),
  body: z
    .object({
      user_id: z.string().trim().optional(),
      team_id: z.string().trim().optional(),
      team_code: z.string().trim().optional(),
    })
    .optional(),
});

export const getTeamMembersSchema = teamIdSchema;
export const inviteTeamSchema = teamIdSchema;
export type CreateTeamInput = z.infer<typeof createTeamSchema>["body"];
export type JoinTeamInput = z.infer<typeof joinTeamSchema>["body"];
