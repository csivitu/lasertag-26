import QRCode from "qrcode";
import { db } from "@lasertag-26/database";
import {
  bookings,
  slots,
  teamMembers,
  user,
} from "@lasertag-26/database/schema";
import { eq, and } from "drizzle-orm";

import { HttpError as AppError } from "../errors";
import {
  sendEmail,
  MAILER_CONFIG,
  type EmailOptions,
} from "./mailer";

export interface RecipientDispatchResult {
  userId: string;
  name: string;
  email: string;
  sent: boolean;
  alreadySent?: boolean;
  messageId?: string | null;
  error?: string;
}

export interface BookingEmailDispatchResult {
  bookingId: string;
  type: "individual" | "team";
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  allSent: boolean;
  recipients: RecipientDispatchResult[];
}

export type SendEmailFn = (options: EmailOptions) => Promise<string | null>;

/**
 * Sends an email with retry logic and exponential backoff.
 * Handles transient network/SMTP failures gracefully.
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  maxAttempts: number = 3,
  initialDelayMs: number = 400,
  sendFn: SendEmailFn = sendEmail,
): Promise<string | null> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    const messageId = await sendFn(options);
    if (messageId) {
      return messageId;
    }
    if (attempt < maxAttempts) {
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[Mailer] Attempt ${attempt} failed for ${options.to}. Retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  console.error(
    `[Mailer] All ${maxAttempts} attempts exhausted for ${options.to}. Delivery failed.`,
  );
  return null;
}

/**
 * Helper to format slot date and window times into readable strings.
 */
export function formatSlotDetails(startTime: Date, endTime: Date) {
  const slotStartDate = new Date(startTime);
  const slotEndDate = new Date(endTime);

  const slotDateStr = slotStartDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formatHour = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const slotTimeStr = `${formatHour(slotStartDate)} - ${formatHour(slotEndDate)}`;
  return { slotDateStr, slotTimeStr };
}

export interface DispatchBookingOptions {
  forceResend?: boolean;
  sendEmailFn?: SendEmailFn;
  retryDelayMs?: number;
}

/**
 * Dispatches booking confirmation email(s) with QR tickets.
 *
 * Edge cases handled:
 * 1. Solo booking delivery failure:
 *    Booking stays valid; confirmationEmailSent stays false until retry succeeds.
 * 2. Team partial failure (e.g. 1 out of 5 bounces):
 *    - Per-member delivery tracking in `team_members` table.
 *    - The whole booking is only marked `confirmationEmailSent = true` if ALL members succeed (`every`, not `some`).
 *    - On retry/resend, only members who have NOT yet received their email are retried (no duplicate emails).
 */
export async function dispatchBookingConfirmation(
  bookingId: string,
  options?: DispatchBookingOptions,
): Promise<BookingEmailDispatchResult> {
  const sendFn = options?.sendEmailFn ?? sendEmail;
  const initialDelay = options?.retryDelayMs ?? 400;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    throw new AppError(404, "Booking not found.");
  }

  const [slot] = await db
    .select()
    .from(slots)
    .where(eq(slots.id, booking.slotId));

  if (!slot) {
    throw new AppError(404, "Slot associated with booking not found.");
  }

  const { slotDateStr, slotTimeStr } = formatSlotDetails(
    slot.startTime,
    slot.endTime,
  );
  const passUrl = `${process.env.WEB_ORIGIN || "http://localhost:3000"}/profile`;

  if (booking.type === "team" && booking.teamCode) {
    const teamMembersList = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        confirmationEmailSent: teamMembers.confirmationEmailSent,
      })
      .from(teamMembers)
      .innerJoin(user, eq(teamMembers.userId, user.id))
      .where(eq(teamMembers.teamCode, booking.teamCode));

    const recipients: RecipientDispatchResult[] = [];

    for (const member of teamMembersList) {
      // If already sent and not forcing resend, skip dispatching again
      if (member.confirmationEmailSent && !options?.forceResend) {
        recipients.push({
          userId: member.id,
          name: member.name,
          email: member.email,
          sent: true,
          alreadySent: true,
        });
        continue;
      }

      const memberQrToken = `QR-${booking.id}-${member.id.slice(0, 6)}`;
      await db
        .update(user)
        .set({ qrToken: memberQrToken })
        .where(eq(user.id, member.id));

      try {
        const memberQrBuffer = await QRCode.toBuffer(memberQrToken, {
          width: 360,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        const messageId = await sendEmailWithRetry(
          {
            to: member.email,
            subject: `LaserTag 2026: Team Slot Confirmed (${booking.teamCode})`,
            template: MAILER_CONFIG.BOOKING_CONFIRMATION,
            variables: {
              name: member.name,
              bookingId: booking.id,
              bookingType: "Team Battle",
              teamCode: booking.teamCode,
              slotDate: slotDateStr,
              slotTime: slotTimeStr,
              passUrl,
              qrToken: memberQrToken,
            },
            attachments: [
              {
                filename: `arena-pass-${memberQrToken}.png`,
                content: memberQrBuffer,
                cid: "qrTicketCode",
              },
            ],
          },
          3,
          initialDelay,
          sendFn,
        );

        if (messageId) {
          // Per-member delivery tracking: Mark individual member as sent
          await db
            .update(teamMembers)
            .set({
              confirmationEmailSent: true,
              emailSentAt: new Date(),
            })
            .where(
              and(
                eq(teamMembers.teamCode, booking.teamCode),
                eq(teamMembers.userId, member.id),
              ),
            );

          recipients.push({
            userId: member.id,
            name: member.name,
            email: member.email,
            sent: true,
            messageId,
          });
        } else {
          recipients.push({
            userId: member.id,
            name: member.name,
            email: member.email,
            sent: false,
            error: "Failed to send email after retries",
          });
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error during email dispatch";
        recipients.push({
          userId: member.id,
          name: member.name,
          email: member.email,
          sent: false,
          error: errorMessage,
        });
      }
    }

    const sentCount = recipients.filter((r) => r.sent).length;
    const failedCount = recipients.filter((r) => !r.sent).length;
    // Strict requirement: EVERY member must be sent for the overall booking to be marked sent
    const allSent = recipients.length > 0 && recipients.every((r) => r.sent);

    if (allSent) {
      await db
        .update(bookings)
        .set({ confirmationEmailSent: true })
        .where(eq(bookings.id, booking.id));
    } else {
      // In case some failed, ensure booking.confirmationEmailSent stays false
      await db
        .update(bookings)
        .set({ confirmationEmailSent: false })
        .where(eq(bookings.id, booking.id));
    }

    return {
      bookingId: booking.id,
      type: "team",
      totalRecipients: teamMembersList.length,
      sentCount,
      failedCount,
      allSent,
      recipients,
    };
  } else {
    // Individual (Solo) booking
    const [targetUser] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, booking.userId));

    if (!targetUser) {
      throw new AppError(404, "User associated with booking not found.");
    }

    if (booking.confirmationEmailSent && !options?.forceResend) {
      return {
        bookingId: booking.id,
        type: "individual",
        totalRecipients: 1,
        sentCount: 1,
        failedCount: 0,
        allSent: true,
        recipients: [
          {
            userId: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            sent: true,
            alreadySent: true,
          },
        ],
      };
    }

    const assignedQrToken = booking.qrToken || `QR-${booking.id}`;
    await db
      .update(user)
      .set({ qrToken: assignedQrToken })
      .where(eq(user.id, targetUser.id));

    const qrBuffer = await QRCode.toBuffer(assignedQrToken, {
      width: 360,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    const messageId = await sendEmailWithRetry(
      {
        to: targetUser.email,
        subject: "LaserTag 2026: Battle Pass Slot Confirmed",
        template: MAILER_CONFIG.BOOKING_CONFIRMATION,
        variables: {
          name: targetUser.name,
          bookingId: booking.id,
          bookingType: "Solo Mission",
          teamCode: "N/A",
          slotDate: slotDateStr,
          slotTime: slotTimeStr,
          passUrl,
          qrToken: assignedQrToken,
        },
        attachments: [
          {
            filename: `arena-pass-${assignedQrToken}.png`,
            content: qrBuffer,
            cid: "qrTicketCode",
          },
        ],
      },
      3,
      initialDelay,
      sendFn,
    );

    const sent = Boolean(messageId);
    if (sent) {
      await db
        .update(bookings)
        .set({ confirmationEmailSent: true })
        .where(eq(bookings.id, booking.id));
    } else {
      await db
        .update(bookings)
        .set({ confirmationEmailSent: false })
        .where(eq(bookings.id, booking.id));
    }

    return {
      bookingId: booking.id,
      type: "individual",
      totalRecipients: 1,
      sentCount: sent ? 1 : 0,
      failedCount: sent ? 0 : 1,
      allSent: sent,
      recipients: [
        {
          userId: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          sent,
          messageId: messageId ?? null,
          error: sent ? undefined : "Failed to send email after retries",
        },
      ],
    };
  }
}

/**
 * Retries all confirmed bookings where confirmation email is not yet complete.
 */
export async function retryPendingBookingConfirmations(limit: number = 20) {
  const pendingBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "confirmed"),
        eq(bookings.confirmationEmailSent, false),
      ),
    )
    .limit(limit);

  const results: BookingEmailDispatchResult[] = [];
  for (const b of pendingBookings) {
    try {
      const result = await dispatchBookingConfirmation(b.id);
      results.push(result);
    } catch (err) {
      console.error(`[Mailer] Error retrying booking ${b.id}:`, err);
    }
  }
  return results;
}
