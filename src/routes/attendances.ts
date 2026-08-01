import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AuthVariables } from "@/middlewares/session";
import { requireAuth } from "@/middlewares/require-auth";
import {
  createAttendance,
  getAllAttendances,
  getAttendanceByUserId,
  updateAttendance,
} from "@/modules/attendances";

const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY"]);

const attendances = new Hono<{ Variables: AuthVariables }>();

attendances.use("*", requireAuth);

attendances.get("/", async (c) => {
  const userId = c.req.query("userId");
  const data = userId
    ? await getAttendanceByUserId(userId)
    : await getAllAttendances();
  return c.json({ data });
});

attendances.get("/me", async (c) => {
  const user = c.get("user")!;
  const data = await getAttendanceByUserId(user.id);
  return c.json({ data });
});

attendances.post(
  "/",
  zValidator(
    "json",
    z.object({
      userId: z.string().min(1).optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      checkIn: z.string().min(1).optional(),
      status: attendanceStatusSchema.optional(),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user")!;
    try {
      const data = await createAttendance({
        userId: body.userId ?? user.id,
        date: body.date,
        checkIn: body.checkIn,
        status: body.status,
      });
      return c.json({ data }, 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create attendance";
      if (message.includes("foreign key") || message.includes("violates")) {
        return c.json({ error: "Invalid userId" }, 400);
      }
      return c.json({ error: message }, 500);
    }
  },
);

attendances.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      checkOut: z.string().min(1).optional(),
      status: attendanceStatusSchema.optional(),
    }),
  ),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const data = await updateAttendance(id, {
      checkOut: body.checkOut,
      status: body.status,
    });
    if (!data) {
      return c.json({ error: "Attendance not found" }, 404);
    }
    return c.json({ data });
  },
);

export default attendances;
