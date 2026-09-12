import { describe, expect, it } from "bun:test";
import { adminAuthRouter } from "../routes/admin-auth";
import { adminPaymentsRouter } from "../routes/admin-payments";
import { slotsRouter } from "../routes/admin-slots";
import { adminTeamsRouter } from "../routes/admin-teams";
import { adminCheckInRouter } from "../routes/admin-checkin";
import { authRouter } from "../routes/auth";
import { publicRegistrationsRouter } from "../routes/public-registrations";
import { registrationsRouter } from "../routes/registrations";
import { publicSlotsRouter } from "../routes/slots";
import { publicTeamsRouter } from "../routes/teams";
import { usersRouter } from "../routes/users";
import verificationRouter from "../routes/verification";
import { openapiDocument } from "./index";

function getRouterRoutes(router: unknown, prefix: string): { path: string; method: string }[] {
  const routes: { path: string; method: string }[] = [];
  const r = router as { stack?: Array<{ route?: { path: string; methods: Record<string, boolean> } }> };
  if (!r || !r.stack) return routes;

  for (const layer of r.stack) {
    if (layer.route) {
      const routePath = layer.route.path === "/" ? "" : layer.route.path;
      const fullPath = (prefix + routePath).replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
      for (const method of Object.keys(layer.route.methods)) {
        if (layer.route.methods[method]) {
          routes.push({ path: fullPath, method: method.toLowerCase() });
        }
      }
    }
  }

  return routes;
}

describe("Swagger / Express Parity", () => {
  const expressRoutes = [
    ...getRouterRoutes(authRouter, "/auth"),
    ...getRouterRoutes(adminAuthRouter, "/admin-auth"),
    ...getRouterRoutes(publicSlotsRouter, "/slots"),
    ...getRouterRoutes(publicTeamsRouter, "/teams"),
    ...getRouterRoutes(publicRegistrationsRouter, "/registrations"),
    ...getRouterRoutes(usersRouter, "/users"),
    ...getRouterRoutes(verificationRouter, "/verification"),
    ...getRouterRoutes(slotsRouter, "/admin/slots"),
    ...getRouterRoutes(registrationsRouter, "/admin/registrations"),
    ...getRouterRoutes(adminTeamsRouter, "/admin/teams"),
    ...getRouterRoutes(adminPaymentsRouter, "/admin/payments"),
    ...getRouterRoutes(adminCheckInRouter, "/admin/checkin"),
  ];

  it("every registered Express endpoint is documented in openapiDocument", () => {
    for (const route of expressRoutes) {
      if (
        route.path === "" ||
        route.path === "/" ||
        route.path.startsWith("/api-docs") ||
        route.path.startsWith("/api/auth")
      ) {
        continue;
      }
      const swaggerPath = (openapiDocument.paths as Record<string, Record<string, unknown>>)[route.path];
      expect(swaggerPath).toBeDefined();
      if (swaggerPath) {
        expect(swaggerPath[route.method]).toBeDefined();
      }
    }
  });

  it("every route in openapiDocument is registered in Express", () => {
    for (const [path, methods] of Object.entries(openapiDocument.paths)) {
      for (const method of Object.keys(methods as Record<string, unknown>)) {
        const found = expressRoutes.some(
          (r) => r.path === path && r.method === method.toLowerCase()
        );
        expect(found).toBe(true);
      }
    }
  });
});
