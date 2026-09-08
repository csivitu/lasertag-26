import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import adminPaymentsRouter from "./routes/admin-payments";
import authRouter from "./routes/auth";
import adminAuthRouter from "./routes/admin-auth";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "LaserTag API",
            version: "1.0.0",
            description: "LaserTag event management API",
        },
        servers: [
            {
                url: "http://localhost:3001",
                description: "Development server",
            },
        ],
    },
    apis: ["./src/swagger/*.ts"],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/admin/payments", adminPaymentsRouter);
app.use("/auth", authRouter);
app.use("/admin/auth", adminAuthRouter);

app.get("/", (req, res) => {
    res.send("API is running!");
});

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});