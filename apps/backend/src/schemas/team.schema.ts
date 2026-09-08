import { z } from 'zod';

export const createTeamSchema = {
  body: z.object({
    leader_id: z.string().min(1, 'leader_id and team_code are required fields.'),
    team_code: z.string().min(1, 'leader_id and team_code are required fields.'),
    members: z.number().int().positive().optional().default(1),
  }),
};

export const getTeamByCodeSchema = {
  params: z.object({
    code: z.string().min(1, 'Team code is required in path.'),
  }),
};

export const joinTeamSchema = {
  params: z.object({
    team_id: z.string().min(1, 'team_id is required in path.'),
  }),
  body: z.object({
    user_id: z.string().min(1, 'user_id is required to join a team.'),
  }),
};

export const getTeamMembersSchema = {
  params: z.object({
    team_id: z.string().min(1, 'team_id is required in path.'),
  }),
};

export const inviteTeamSchema = {
  params: z.object({
    team_id: z.string().min(1, 'team_id is required in path.'),
  }),
};
