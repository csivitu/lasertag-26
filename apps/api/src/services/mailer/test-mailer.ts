import { sendEmail } from "./index";
import { MAILER_CONFIG } from "./config";

const recipient = process.argv[2] || "test@example.com";

console.log(`Sending test booking confirmation to: ${recipient}...`);

const messageId = await sendEmail({
  to: recipient,
  subject: "LaserTag 2026: Battle Pass Slot Confirmed (Test)",
  template: MAILER_CONFIG.BOOKING_CONFIRMATION,
  variables: {
    name: "Operative CSI",
    bookingId: "BKG-TEST-1234",
    bookingType: "Team Battle",
    teamCode: "TEAM-99",
    slotDate: "Friday, Sep 18, 2026",
    slotTime: "07:30 PM - 08:00 PM",
    passUrl: "http://localhost:3000/profile",
  },
});

if (messageId) {
  console.log("Test confirmation email sent successfully:", messageId);
} else {
  console.error("Test confirmation email failed.");
}
