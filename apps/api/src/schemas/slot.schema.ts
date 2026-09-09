import { z } from "zod";

export const reserveSlotSchema = {
  params: z.object({
    slot_id: z.string().min(1, "slot_id is required in path."),
  }),
  body: z
    .object({
      user_id: z
        .string()
        .min(1, "user_id and type (individual/team) are required fields."),
      type: z.enum(["individual", "team"], {
        message: 'type must be either "individual" or "team".',
      }),
      team_code: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.type === "team") {
          return Boolean(data.team_code && data.team_code.trim().length > 0);
        }
        return true;
      },
      {
        message: "team_code is required for team booking.",
        path: ["team_code"],
      }
    ),
};

export const createSlotSchema = {
  body: z.object({
    startTime: z.string().datetime({ message: "startTime must be a valid ISO datetime string." }),
    endTime: z.string().datetime({ message: "endTime must be a valid ISO datetime string." }),
    capacity: z.number().int().positive("capacity must be a positive integer."),
  }),
};

export const deleteSlotSchema = {
  params: z.object({
    slot_id: z.string().min(1, "slot_id is required in path."),
  }),
};
