import QRCode from "qrcode";

import { db } from "@lasertag-26/database";
import { bookings, user, teamMembers } from "@lasertag-26/database/schema";
import { eq } from "drizzle-orm";

import { sendEmail, MAILER_CONFIG } from "./index";

// ─── Shared types ────────────────────────────────────────────────────────────

interface SlotInfo {
  slotDate: string;
  slotTime: string;
}

interface BookingEmailParams {
  bookingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: "individual" | "team";
  teamCode: string | null;
  qrToken: string;
  newSlot: SlotInfo;
  passUrl: string;
}

interface SlotChangeEmailParams extends BookingEmailParams {
  oldSlot: SlotInfo;
}

// ─── QR buffer helper ────────────────────────────────────────────────────────

async function renderQrBuffer(token: string): Promise<Buffer> {
  return QRCode.toBuffer(token, {
    width: 360,
    margin: 1,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}

// ─── Booking Confirmation (new booking) ──────────────────────────────────────

/**
 * Sends a booking confirmation email for both solo and team bookings.
 * For team bookings, each member gets their own personalised QR code.
 * Fire-and-forget: logs errors internally and never throws.
 */
export async function sendBookingConfirmationEmail(
  params: BookingEmailParams,
): Promise<void> {
  try {
    if (params.type === "team" && params.teamCode) {
      await sendTeamEmails(params, MAILER_CONFIG.BOOKING_CONFIRMATION, {
        subject: `LaserTag 2026: Team Slot Confirmed (${params.teamCode})`,
        extraVars: {},
      });
    } else {
      await sendSoloEmail(params, MAILER_CONFIG.BOOKING_CONFIRMATION, {
        subject: "LaserTag 2026: Battle Pass Slot Confirmed",
        extraVars: {},
      });
    }
  } catch (err) {
    console.error("[Mailer] Background booking-confirmation dispatch error:", err);
  }
}

// ─── Slot Change Notification ────────────────────────────────────────────────

/**
 * Sends a slot-change notification email for both solo and team bookings.
 * Includes old slot details so the user can see what changed.
 * Fire-and-forget: logs errors internally and never throws.
 */
export async function sendSlotChangeEmail(
  params: SlotChangeEmailParams,
): Promise<void> {
  try {
    const extraVars = {
      oldSlotDate: params.oldSlot.slotDate,
      oldSlotTime: params.oldSlot.slotTime,
    };

    if (params.type === "team" && params.teamCode) {
      await sendTeamEmails(params, MAILER_CONFIG.SLOT_CHANGE, {
        subject: `LaserTag 2026: Team Slot Rescheduled (${params.teamCode})`,
        extraVars,
      });
    } else {
      await sendSoloEmail(params, MAILER_CONFIG.SLOT_CHANGE, {
        subject: "LaserTag 2026: Battle Pass Slot Rescheduled",
        extraVars,
      });
    }
  } catch (err) {
    console.error("[Mailer] Background slot-change dispatch error:", err);
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

interface DispatchOptions {
  subject: string;
  extraVars: Record<string, string>;
}

async function sendSoloEmail(
  params: BookingEmailParams,
  template: string,
  opts: DispatchOptions,
): Promise<void> {
  const qrBuffer = await renderQrBuffer(params.qrToken);

  const messageId = await sendEmail({
    to: params.userEmail,
    subject: opts.subject,
    template,
    variables: {
      name: params.userName,
      bookingId: params.bookingId,
      bookingType: "Solo Mission",
      teamCode: "N/A",
      slotDate: params.newSlot.slotDate,
      slotTime: params.newSlot.slotTime,
      passUrl: params.passUrl,
      qrToken: params.qrToken,
      ...opts.extraVars,
    },
    attachments: [
      {
        filename: `arena-pass-${params.qrToken}.png`,
        content: qrBuffer,
        cid: "qrTicketCode",
      },
    ],
  });

  if (messageId) {
    await db
      .update(bookings)
      .set({ confirmationEmailSent: true })
      .where(eq(bookings.id, params.bookingId));
  }
}

async function sendTeamEmails(
  params: BookingEmailParams,
  template: string,
  opts: DispatchOptions,
): Promise<void> {
  const teamUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(teamMembers)
    .innerJoin(user, eq(teamMembers.userId, user.id))
    .where(eq(teamMembers.teamCode, params.teamCode!));

  const emailResults = await Promise.all(
    teamUsers.map(async (member) => {
      const memberQrToken = `QR-${params.bookingId}-${member.id.slice(0, 6)}`;

      await db
        .update(user)
        .set({ qrToken: memberQrToken })
        .where(eq(user.id, member.id));

      const memberQrBuffer = await renderQrBuffer(memberQrToken);

      return sendEmail({
        to: member.email,
        subject: opts.subject,
        template,
        variables: {
          name: member.name,
          bookingId: params.bookingId,
          bookingType: "Team Battle",
          teamCode: params.teamCode!,
          slotDate: params.newSlot.slotDate,
          slotTime: params.newSlot.slotTime,
          passUrl: params.passUrl,
          qrToken: memberQrToken,
          ...opts.extraVars,
        },
        attachments: [
          {
            filename: `arena-pass-${memberQrToken}.png`,
            content: memberQrBuffer,
            cid: "qrTicketCode",
          },
        ],
      });
    }),
  );

  const anySent = emailResults.some((messageId) => messageId !== null);
  if (anySent && teamUsers.length > 0) {
    await db
      .update(bookings)
      .set({ confirmationEmailSent: true })
      .where(eq(bookings.id, params.bookingId));
  }
}
