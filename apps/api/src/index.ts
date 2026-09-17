import { createApp } from "./app";
import { env } from "./env";
import { seedAdmins } from "./seed-admins";

await seedAdmins(env);

// Presence check only (lengths, never values): lets deploy logs prove the
// running process actually sees the staff credentials it was given.
console.log(
  `Staff auth configured (NODE_ENV=${env.NODE_ENV}, ` +
    `super_admin_password_len=${env.SUPER_ADMIN_PASSWORD.length}, ` +
    `admin_password_len=${env.ADMIN_PASSWORD.length})`,
);

const app = createApp(env);

const server = app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
});

function shutdown(signal: string) {
    console.log(`${signal} received, closing server`);
    server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
// Custom SMTP Mailer ready
