import { sendEmail } from "./index";
import { MAILER_CONFIG } from "./config";

const recipient = process.argv[2] || "test@example.com";

console.log(`Sending test booking confirmation to: ${recipient}...`);

const messageId = await sendEmail({
  to: recipient,
  subject: "Slot Booking Confirmed for LaserTag @Gravitas’26",
  template: MAILER_CONFIG.BOOKING_CONFIRMATION,
  variables: {
    name: "Operative CSI",
    user_name: "Operative CSI",
    bookingId: "BKG-TEST-1234",
    bookingType: "Team Battle",
    teamCode: "TEAM-99",
    slotDate: "Friday, Sep 18, 2026",
    date: "Friday, Sep 18, 2026",
    slotTime: "07:30 PM - 08:00 PM",
    slot: "07:30 PM - 08:00 PM",
    registrationNumber: "21BCE1234",
    passUrl: "http://localhost:3000/profile",
    qrToken: "QR-BKG-TEST-1234",
  },
});

if (messageId) {
  console.log("Test confirmation email sent successfully:", messageId);
} else {
  console.error("Test confirmation email failed.");
}
