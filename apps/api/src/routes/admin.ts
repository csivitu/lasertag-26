import { Router } from "express";

import { requireAdmin } from "../middlewares/auth.middleware";
import { adminCheckInRouter } from "./admin-checkin";
import { adminPaymentsRouter } from "./admin-payments";
import { adminTeamsRouter } from "./admin-teams";
import { registrationsRouter } from "./registrations";
import { slotsRouter } from "./admin-slots";

export const adminRouter = Router();

// Applied to the whole /admin subtree, including unknown sub-paths, so an
// unauthenticated probe of e.g. /admin/whatever 401s instead of 404ing and
// revealing the route surface.
adminRouter.use(requireAdmin);

adminRouter.use("/slots", slotsRouter);
adminRouter.use("/registrations", registrationsRouter);
adminRouter.use("/teams", adminTeamsRouter);
adminRouter.use("/payments", adminPaymentsRouter);
adminRouter.use("/checkin", adminCheckInRouter);
