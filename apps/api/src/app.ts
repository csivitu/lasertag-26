import cors from "cors";
import express, { type Express } from "express";
import { toNodeHandler } from "better-auth/node";
import swaggerUi from "swagger-ui-express";

import { auth } from "./auth";
import { errorHandler, notFound } from "./middlewares/errorHandler";
import { adminAuthRouter } from "./routes/admin-auth";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { publicSlotsRouter } from "./routes/slots";
import { publicTeamsRouter } from "./routes/teams";
import { publicRegistrationsRouter } from "./routes/public-registrations";
import { usersRouter } from "./routes/users";
import verificationRouter from "./routes/verification";
import { openapiDocument } from "./swagger";
import type { Env } from "./env";

/**
 * Builds the app without binding a port, so it can be exercised directly
 * (a future supertest suite, a serverless adapter) without `index.ts`'s
 * process-level concerns.
 */
export function createApp(env: Env): Express {
    const app = express();

    // Behind Nginx (TLS ends at proxy) — needed so Secure cookies + proto work.
    app.set("trust proxy", 1);

    const allowedOrigins = [
        env.WEB_ORIGIN,
        env.ADMIN_ORIGIN,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ];

    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            credentials: true,
        }),
    );

    // Must run before express.json(). toNodeHandler reads the raw request
    // stream to build a Fetch Request; a body already consumed by the JSON
    // parser breaks every auth POST.
    // Express 5 named splat parameter: preserves the full /api/auth/* url for Better Auth
    app.all("/api/auth/*splat", toNodeHandler(auth));

    app.use(express.json());

    app.get("/", (_req, res) => {
        res.json({ success: true, message: "API is running!" });
    });

    // Not under /admin: that whole subtree requires an existing admin
    // session, and neither of these can presuppose one.
    app.use("/auth", authRouter);
    app.use("/admin-auth", adminAuthRouter);

    // Participant-facing.
    app.use("/slots", publicSlotsRouter);
    app.use("/teams", publicTeamsRouter);
    app.use("/registrations", publicRegistrationsRouter);
    app.use("/users", usersRouter);
    app.use("/verification", verificationRouter);

    app.use("/admin", adminRouter);

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
    app.get("/api-docs.json", (_req, res) => {
        res.json(openapiDocument);
    });

    app.use(notFound);
    app.use(errorHandler);

    return app;
}
