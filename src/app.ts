import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { auth } from "@/lib/auth";
import {
  sessionMiddleware,
  type AuthVariables,
} from "@/middlewares/session";

import departments from "@/routes/departments";
import employees from "@/routes/employees";
import leaves from "@/routes/leaves";
import attendances from "@/routes/attendances";
import documents from "@/routes/documents";

import { createRouteHandler } from "uploadthing/server";
import { uploadRouter } from "@/lib/uploadthing";
import { openApiSpec } from "@/openapi";

const app = new Hono<{ Variables: AuthVariables }>();

// ======================
// CORS
// ======================
const allowedOrigins = [
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "x-uploadthing-version",
      "x-uploadthing-package",
      "x-uploadthing-api-key",
      "x-uploadthing-be-adapter",
      "x-uploadthing-fe-package",
    ],
    allowMethods: ["POST", "GET", "PATCH", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    maxAge: 600,
    credentials: true,
  }),
);

// ======================
// Better Auth
// ======================
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ======================
// Session Middleware
// ======================
app.use("*", sessionMiddleware);

// ======================
// API docs (Swagger UI)
// ======================
app.get("/openapi.json", (c) => c.json(openApiSpec));
app.get("/ui", swaggerUI({ url: "/openapi.json" }));
app.get("/docs", (c) => c.redirect("/ui"));

// ======================
// Health Check
// ======================
app.get("/health", (c) => c.json({ ok: true }));

// ======================
// Session Check
// ======================
app.get("/session", (c) => {
  const user = c.get("user");
  const session = c.get("session");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ user, session });
});

// ======================
// Your API Routes
// ======================
app.route("/api/departments", departments);
app.route("/api/employees", employees);
app.route("/api/leaves", leaves);
app.route("/api/attendances", attendances);
app.route("/api/documents", documents);

// ======================
// UploadThing
// ======================
function getUploadThingToken() {
  const raw = process.env.UPLOADTHING_TOKEN?.trim();
  if (!raw) return undefined;
  // Support quoted values from .env files
  return raw.replace(/^['"]|['"]$/g, "");
}

const handlers = createRouteHandler({
  router: uploadRouter,
  config: {
    token: getUploadThingToken(),
  },
});

app.all("/api/uploadthing", (c) => handlers(c.req.raw));

export default app;
export type AppType = typeof app;