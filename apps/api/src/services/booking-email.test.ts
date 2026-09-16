import { describe, expect, test } from "bun:test";
import { db } from "@lasertag-26/database";
import {
  bookings,
  slots,
  teamMembers,
  teams,
  user,
} from "@lasertag-26/database/schema";
import { eq, inArray } from "drizzle-orm";

import {
  formatSlotDetails,
  sendEmailWithRetry,
  dispatchBookingConfirmation,
  type SendEmailFn,
} from "./booking-email";

describe("formatSlotDetails", () => {
  test("formats date and 12-hour time window correctly", () => {
    const start = new Date("2026-10-15T10:00:00Z");
    const end = new Date("2026-10-15T11:30:00Z");
    const formatted = formatSlotDetails(start, end);

    expect(formatted.slotDateStr).toContain("2026");
    expect(formatted.slotDateStr).toContain("Oct");
    expect(formatted.slotTimeStr).toContain("-");
  });
});

describe("sendEmailWithRetry", () => {
  test("returns messageId immediately on first successful attempt", async () => {
    let callCount = 0;
    const mockSend: SendEmailFn = async () => {
      callCount++;
      return "msg-success-1";
    };

    const result = await sendEmailWithRetry(
      { to: "test@example.com", subject: "Test" },
      3,
      10,
      mockSend,
    );

    expect(result).toBe("msg-success-1");
    expect(callCount).toBe(1);
  });

  test("retries after initial failure and succeeds", async () => {
    let callCount = 0;
    const mockSend: SendEmailFn = async () => {
      callCount++;
      if (callCount === 1) return null; // transient failure
      return "msg-retry-success";
    };

    const result = await sendEmailWithRetry(
      { to: "test@example.com", subject: "Test" },
      3,
      10,
      mockSend,
    );

    expect(result).toBe("msg-retry-success");
    expect(callCount).toBe(2);
  });

  test("returns null after exhausting all attempts", async () => {
    let callCount = 0;
    const mockSend: SendEmailFn = async () => {
      callCount++;
      return null;
    };

    const result = await sendEmailWithRetry(
      { to: "test@example.com", subject: "Test" },
      3,
      5,
      mockSend,
    );

    expect(result).toBeNull();
    expect(callCount).toBe(3);
  });
});

describe("Booking Confirmation Edge Cases", () => {
  test(
    "Edge Case 1: Solo email send fails -> Booking remains valid, retry succeeds",
    async () => {
      const testUserId = `test-solo-user-${Date.now()}`;
      const testSlotId = "55555555-5555-5555-5555-555555555555";
      const testBookingId = `BKG-SOLO-TEST-${Date.now()}`;

      // Clean up / setup slot & user
      await db
        .insert(user)
        .values({
          id: testUserId,
          name: "Solo Operative",
          email: `${testUserId}@example.com`,
          paid: true,
        })
        .onConflictDoNothing();

      await db
        .insert(slots)
        .values({
          id: testSlotId,
          startTime: new Date("2026-10-10T14:00:00Z"),
          endTime: new Date("2026-10-10T15:00:00Z"),
          capacity: 10,
        })
        .onConflictDoNothing();

      await db.insert(bookings).values({
        id: testBookingId,
        type: "individual",
        status: "confirmed",
        userId: testUserId,
        slotId: testSlotId,
        confirmationEmailSent: false,
      });

      // 1. First attempt: Email sending fails completely (e.g. SMTP down)
      const failingSend: SendEmailFn = async () => null;

      const failResult = await dispatchBookingConfirmation(testBookingId, {
        sendEmailFn: failingSend,
        retryDelayMs: 5,
      });

      expect(failResult.sentCount).toBe(0);
      expect(failResult.failedCount).toBe(1);
      expect(failResult.allSent).toBe(false);

      // CRITICAL: Verify booking is still valid in database and confirmationEmailSent is false
      const [bookingAfterFail] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, testBookingId));
      expect(bookingAfterFail).toBeDefined();
      expect(bookingAfterFail.status).toBe("confirmed");
      expect(bookingAfterFail.confirmationEmailSent).toBe(false);

      // 2. Retry path: Email service is restored
      const successfulSend: SendEmailFn = async () => "msg-solo-recovered";

      const retryResult = await dispatchBookingConfirmation(testBookingId, {
        sendEmailFn: successfulSend,
        retryDelayMs: 5,
      });

      expect(retryResult.sentCount).toBe(1);
      expect(retryResult.failedCount).toBe(0);
      expect(retryResult.allSent).toBe(true);

      const [bookingAfterRetry] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, testBookingId));
      expect(bookingAfterRetry.confirmationEmailSent).toBe(true);

      // Cleanup
      await db.delete(bookings).where(eq(bookings.id, testBookingId));
      await db.delete(user).where(eq(user.id, testUserId));
      await db.delete(slots).where(eq(slots.id, testSlotId));
    },
    30000,
  );

  test(
    "Edge Case 2: Team of 5, one email bounces -> Per-member tracking and targeted retry",
    async () => {
      const teamCode = `TM-${Date.now().toString().slice(-6)}`;
      const slotId = "66666666-6666-6666-6666-666666666666";
      const bookingId = `BKG-TEAM-TEST-${Date.now()}`;

      // Create 5 team members
      const memberIds = Array.from({ length: 5 }, (_, i) => `member-${Date.now()}-${i + 1}`);

      await db
        .insert(slots)
        .values({
          id: slotId,
          startTime: new Date("2026-10-10T16:00:00Z"),
          endTime: new Date("2026-10-10T17:00:00Z"),
          capacity: 10,
        })
        .onConflictDoNothing();

      await db.insert(user).values(
        memberIds.map((id, idx) => ({
          id,
          name: `Operative ${idx + 1}`,
          email: `${id}@test.lasertag.internal`,
          paid: true,
        })),
      );

      await db.insert(teams).values({
        teamCode,
        leaderId: memberIds[0],
        members: 5,
      });

      await db.insert(teamMembers).values(
        memberIds.map((userId) => ({
          teamCode,
          userId,
          confirmationEmailSent: false,
        })),
      );

      await db.insert(bookings).values({
        id: bookingId,
        type: "team",
        teamCode,
        status: "confirmed",
        userId: memberIds[0],
        slotId,
        confirmationEmailSent: false,
      });

      // 1. Initial Dispatch: 4 members succeed, but member 5 bounces/fails
      const bouncingMemberEmail = `${memberIds[4]}@test.lasertag.internal`;
      const partialSendFn: SendEmailFn = async (options) => {
        if (options.to === bouncingMemberEmail) {
          return null; // Bounced / rejected
        }
        return `msg-ok-${options.to}`;
      };

      const firstDispatch = await dispatchBookingConfirmation(bookingId, {
        sendEmailFn: partialSendFn,
        retryDelayMs: 5,
      });

      expect(firstDispatch.totalRecipients).toBe(5);
      expect(firstDispatch.sentCount).toBe(4);
      expect(firstDispatch.failedCount).toBe(1);
      // CRITICAL FIX: some() is gone! allSent MUST be false when any member fails.
      expect(firstDispatch.allSent).toBe(false);

      // Verify DB per-member state:
      const membersInDb = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.teamCode, teamCode));

      const sentMembers = membersInDb.filter((m) => m.confirmationEmailSent);
      const unsentMembers = membersInDb.filter((m) => !m.confirmationEmailSent);

      expect(sentMembers.length).toBe(4);
      expect(unsentMembers.length).toBe(1);
      expect(unsentMembers[0].userId).toBe(memberIds[4]);

      // Overall booking MUST remain confirmationEmailSent = false
      const [bookingInDb] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId));
      expect(bookingInDb.confirmationEmailSent).toBe(false);

      // 2. Retry Dispatch: Only the bounced member should be retried!
      const emailedAddressesOnRetry: string[] = [];
      const retrySendFn: SendEmailFn = async (options) => {
        emailedAddressesOnRetry.push(options.to as string);
        return `msg-recovered-${options.to}`;
      };

      const retryDispatch = await dispatchBookingConfirmation(bookingId, {
        sendEmailFn: retrySendFn,
        retryDelayMs: 5,
      });

    // Verify that retry ONLY sent to the 1 member who bounced, NOT the 4 already-confirmed members
    expect(emailedAddressesOnRetry).toEqual([bouncingMemberEmail]);
    expect(retryDispatch.sentCount).toBe(5); // 4 alreadySent + 1 newly sent
    expect(retryDispatch.failedCount).toBe(0);
    expect(retryDispatch.allSent).toBe(true);

    // Verify DB state after successful retry
    const membersAfterRetry = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamCode, teamCode));
    expect(membersAfterRetry.every((m) => m.confirmationEmailSent)).toBe(true);

    const [bookingAfterRetry] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));
    expect(bookingAfterRetry.confirmationEmailSent).toBe(true);

    // Cleanup
    await db.delete(bookings).where(eq(bookings.id, bookingId));
    await db.delete(teamMembers).where(eq(teamMembers.teamCode, teamCode));
    await db.delete(teams).where(eq(teams.teamCode, teamCode));
    await db.delete(user).where(inArray(user.id, memberIds));
    await db.delete(slots).where(eq(slots.id, slotId));
  }, 30000);
});
