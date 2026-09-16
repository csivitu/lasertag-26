import { adminLoginSchema, loginResponseSchema, loginSchema } from "../validations/auth.validation";
import { responses, toSchema } from "./shared";

export const authSchemas = {
  Login: toSchema(loginSchema.shape.body),
  AdminLogin: toSchema(adminLoginSchema.shape.body),
  LoginResponse: toSchema(loginResponseSchema),
};

const loginResponse = {
  description: "Signed in; session cookie set on the response",
  content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
};

const loginBody = {
  required: true,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Login" } } },
};

export const authPaths = {
  "/auth/login": {
    post: {
      summary: "Sign in",
      tags: ["Auth"],
      // Overrides the document-level session requirement: this is how you get one.
      security: [],
      requestBody: loginBody,
      responses: {
        200: loginResponse,
        400: responses.badRequest,
        401: responses.error("Invalid email or password"),
      },
    },
  },
  "/auth/logout": {
    post: {
      summary: "Sign out",
      tags: ["Auth"],
      security: [],
      responses: { 200: { description: "Signed out" } },
    },
  },
  "/admin-auth/login": {
    post: {
      summary: "Sign in as staff (password only)",
      description:
        "Password-only login. The super-admin password signs in as super_admin, the admin password as admin. Same 401 either way for a wrong password.",
      tags: ["Auth"],
      security: [],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/AdminLogin" } } },
      },
      responses: {
        200: loginResponse,
        400: responses.badRequest,
        401: responses.error("Invalid password"),
      },
    },
  },
  "/admin-auth/logout": {
    post: {
      summary: "Sign out of an admin session",
      tags: ["Auth"],
      security: [],
      responses: { 200: { description: "Signed out" } },
    },
  },
  "/admin-auth/me": {
    get: {
      summary: "Current staff session (id, email, role)",
      description: "Lets the admin UI know which role is signed in to hide super-admin-only actions.",
      tags: ["Auth"],
      responses: {
        200: { description: "Session user" },
        401: responses.unauthorized,
        403: responses.forbidden,
      },
    },
  },
};
