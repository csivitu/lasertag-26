import { sendEmail } from "./index";

const messageId = await sendEmail({
    to: "shriramkabra28@yahoo.com",
    subject: "LaserTag Mailer Test",
    template: "test",
});

if (messageId) {
    console.log("Test email sent successfully:", messageId);
} else {
    console.error("Test email failed.");
}