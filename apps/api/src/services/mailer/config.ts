export const MAILER_CONFIG = {
  BOOKING_CONFIRMATION: "booking-confirmation",
  TEST: "test",
} as const;

export type EmailTemplateName = keyof typeof MAILER_CONFIG;
