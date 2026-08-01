import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AuthVariables } from "@/middlewares/session";
import { requireAuth } from "@/middlewares/require-auth";
import {
  createEmployeeProfile,
  getAllEmployees,
  getEmployeeByUserId,
  updateEmployeeProfile,
} from "@/modules/users";

const roleSchema = z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]);

const employees = new Hono<{ Variables: AuthVariables }>();

employees.use("*", requireAuth);

employees.get("/", async (c) => {
  const data = await getAllEmployees();
  return c.json({ data });
});

employees.get("/me", async (c) => {
  const user = c.get("user")!;
  const data = await getEmployeeByUserId(user.id);
  if (!data) {
    return c.json({ error: "Employee profile not found" }, 404);
  }
  return c.json({ data });
});

employees.get("/:userId", async (c) => {
  const userId = c.req.param("userId");
  const data = await getEmployeeByUserId(userId);
  if (!data) {
    return c.json({ error: "Employee profile not found" }, 404);
  }
  return c.json({ data });
});

employees.post(
  "/",
  zValidator(
    "json",
    z.object({
      userId: z.string().min(1).optional(),
      phone: z.string().min(1).max(50).optional(),
      role: roleSchema.optional(),
      departmentId: z.string().min(1).optional(),
      hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user")!;
    const userId = body.userId ?? user.id;

    try {
      const existing = await getEmployeeByUserId(userId);
      if (existing) {
        return c.json({ error: "Employee profile already exists for this user" }, 409);
      }

      const data = await createEmployeeProfile({
        userId,
        phone: body.phone,
        role: body.role,
        departmentId: body.departmentId,
        hireDate: body.hireDate,
      });
      return c.json({ data }, 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create employee profile";
      if (message.includes("unique") || message.includes("duplicate")) {
        return c.json({ error: "Employee profile already exists" }, 409);
      }
      if (message.includes("foreign key") || message.includes("violates")) {
        return c.json({ error: "Invalid userId or departmentId" }, 400);
      }
      return c.json({ error: message }, 500);
    }
  },
);

employees.patch(
  "/:userId",
  zValidator(
    "json",
    z.object({
      phone: z.string().min(1).max(50).optional(),
      role: roleSchema.optional(),
      departmentId: z.string().min(1).nullable().optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]).optional(),
    }),
  ),
  async (c) => {
    const userId = c.req.param("userId");
    const body = c.req.valid("json");

    const payload: {
      phone?: string;
      role?: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";
      departmentId?: string;
      status?: string;
    } = {};

    if (body.phone !== undefined) payload.phone = body.phone;
    if (body.role !== undefined) payload.role = body.role;
    if (body.status !== undefined) payload.status = body.status;
    if (body.departmentId !== undefined && body.departmentId !== null) {
      payload.departmentId = body.departmentId;
    }

    const data = await updateEmployeeProfile(userId, payload);
    if (!data) {
      return c.json({ error: "Employee profile not found" }, 404);
    }
    return c.json({ data });
  },
);

export default employees;
