import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AuthVariables } from "@/middlewares/session";
import { requireAuth } from "@/middlewares/require-auth";
import {
  createLeave,
  getAllLeaves,
  getLeavesByUserId,
  updateLeaveStatus,
} from "@/modules/leaves";

const leaveTypeSchema = z.enum([
  "ANNUAL",
  "SICK",
  "UNPAID",
  "MATERNITY",
  "PATERNITY",
  "OTHER",
]);

const leaves = new Hono<{ Variables: AuthVariables }>();

leaves.use("*", requireAuth);

leaves.get("/", async (c) => {
  const userId = c.req.query("userId");
  const data = userId ? await getLeavesByUserId(userId) : await getAllLeaves();
  return c.json({ data });
});

leaves.get("/me", async (c) => {
  const user = c.get("user")!;
  const data = await getLeavesByUserId(user.id);
  return c.json({ data });
});

leaves.post(
  "/",
  zValidator(
    "json",
    z
      .object({
        userId: z.string().min(1).optional(),
        type: leaveTypeSchema,
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        reason: z.string().max(500).optional(),
      })
      .refine((v) => v.endDate >= v.startDate, {
        message: "endDate must be on or after startDate",
        path: ["endDate"],
      }),
  ),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user")!;
    try {
      const data = await createLeave({
        userId: body.userId ?? user.id,
        type: body.type,
        startDate: body.startDate,
        endDate: body.endDate,
        reason: body.reason,
      });
      return c.json({ data }, 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create leave";
      if (message.includes("foreign key") || message.includes("violates")) {
        return c.json({ error: "Invalid userId" }, 400);
      }
      return c.json({ error: message }, 500);
    }
  },
);

leaves.patch(
  "/:id/status",
  zValidator(
    "json",
    z.object({
      status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
    }),
  ),
  async (c) => {
    const id = c.req.param("id");
    const { status } = c.req.valid("json");
    const user = c.get("user")!;

    const data = await updateLeaveStatus(
      id,
      status,
      status === "APPROVED" || status === "REJECTED" ? user.id : undefined,
    );

    if (!data) {
      return c.json({ error: "Leave not found" }, 404);
    }
    return c.json({ data });
  },
);

export default leaves;
