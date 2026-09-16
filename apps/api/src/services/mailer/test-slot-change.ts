import { sendEmail } from "./index";
import { MAILER_CONFIG } from "./config";

const recipient = process.argv[2] || "test@example.com";

console.log(`Sending test slot-change notification to: ${recipient}...`);

const messageId = await sendEmail({
  to: recipient,
  subject: "Slot Update Confirmed for LaserTag @Gravitas’26",
  template: MAILER_CONFIG.SLOT_CHANGE,
  variables: {
    name: "Operative CSI",
    user_name: "Operative CSI",
    bookingId: "BKG-TEST-1234",
    bookingType: "Solo Mission",
    teamCode: "N/A",
    oldSlotDate: "Thursday, Sep 17, 2026",
    oldSlotTime: "06:00 PM - 06:30 PM",
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
  console.log("Test slot-change email sent successfully:", messageId);
} else {
  console.error("Test slot-change email failed.");
}
