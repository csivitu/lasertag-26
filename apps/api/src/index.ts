import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { adminSlotsRouter } from "./routes/adminSlots";

const app = express();
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running!");
});

app.use("/admin/slots", adminSlotsRouter);

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});