import "dotenv/config";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import registrationsRouter from "./routes/registrations";
import usersRouter from "./routes/users";
import adminRouter from "./routes/admin";

const app = express();

// BetterAuth handler — must be mounted BEFORE express.json()
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running!");
});

app.use("/registrations", registrationsRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter);

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});