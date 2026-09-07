import { Router } from "express";

import { requireAdmin } from "../middleware/requireAdmin";
import { registrationsRouter } from "./registrations";
import { slotsRouter } from "./slots";
import { teamsRouter } from "./teams";

export const adminRouter = Router();

// Applied to the whole /admin subtree, including unknown sub-paths, so an
// unauthenticated probe of e.g. /admin/whatever 401s instead of 404ing and
// revealing the route surface.
adminRouter.use(requireAdmin);

adminRouter.use("/slots", slotsRouter);
adminRouter.use("/registrations", registrationsRouter);
adminRouter.use("/teams", teamsRouter);
