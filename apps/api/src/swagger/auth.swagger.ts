import { loginResponseSchema, loginSchema } from "../validations/auth.validation";
import { responses, toSchema } from "./shared";

export const authSchemas = {
  Login: toSchema(loginSchema.shape.body),
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
      summary: "Sign in as an admin",
      description:
        "Same as /auth/login, but rejects the attempt before checking the password if the email isn't an admin's — with the same 401 either way, so the response can't be used to tell 'unknown email' apart from 'exists, not an admin'.",
      tags: ["Auth"],
      security: [],
      requestBody: loginBody,
      responses: {
        200: loginResponse,
        400: responses.badRequest,
        401: responses.error("Invalid email or password, or not an admin"),
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
};
