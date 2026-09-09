import { createApp } from "./app";
import { env } from "./env";

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
