export const MAILER_CONFIG = {
    SLOT_BOOKED: "slot_booked",
} as const;

export type EmailTemplateName = keyof typeof MAILER_CONFIG;