import cors from "cors";
import express, { type Express } from "express";
import { toNodeHandler } from "better-auth/node";
import swaggerUi from "swagger-ui-express";

import { auth } from "./auth";
import { openapiDocument } from "./docs/openapi";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { adminRouter } from "./routes/admin";
import type { Env } from "./env";

/**
 * Builds the app without binding a port, so it can be exercised directly
 * (a future supertest suite, a serverless adapter) without `index.ts`'s
 * process-level concerns.
 */
export function createApp(env: Env): Express {
    const app = express();

    app.use(
        cors({
            // Not "*": better-auth's cookies are credentialed, and a wildcard
            // origin is rejected by browsers for credentialed requests anyway.
            origin: env.WEB_ORIGIN,
            credentials: true,
        }),
    );

    // Must run before express.json(). toNodeHandler reads the raw request
    // stream to build a Fetch Request; a body already consumed by the JSON
    // parser breaks every auth POST.
    app.all("/api/auth/*splat", toNodeHandler(auth));

    app.use(express.json());

    app.get("/", (_req, res) => {
        res.send("API is running!");
    });

    app.use("/admin", adminRouter);

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
    app.get("/api-docs.json", (_req, res) => {
        res.json(openapiDocument);
    });

    app.use(notFound);
    app.use(errorHandler);

    return app;
}
