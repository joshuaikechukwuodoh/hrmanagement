import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AuthVariables } from "@/middlewares/session";
import { requireAuth } from "@/middlewares/require-auth";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  updateDepartment,
} from "@/modules/departments";

const departments = new Hono<{ Variables: AuthVariables }>();

departments.use("*", requireAuth);

departments.get("/", async (c) => {
  const data = await getAllDepartments();
  return c.json({ data });
});

departments.post( "/",zValidator(
    "json",
    z.object({
      name: z.string().min(1).max(100),
    }),
  ),
  async (c) => {
    const { name } = c.req.valid("json");
    try {
      const data = await createDepartment(name);
      return c.json({ data }, 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create department";
      if (message.includes("unique") || message.includes("duplicate")) {
        return c.json({ error: "Department name already exists" }, 409);
      }
      return c.json({ error: message }, 500);
    }
  },
);

departments.patch(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).max(100),
    }),
  ),
  async (c) => {
    const id = c.req.param("id");
    const { name } = c.req.valid("json");
    const data = await updateDepartment(id, name);
    if (!data) {
      return c.json({ error: "Department not found" }, 404);
    }
    return c.json({ data });
  },
);

departments.delete("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const result = await deleteDepartment(id);
    if (!result) {
      return c.json({ error: "Department not found" }, 404);
    }
    return c.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete department";
    return c.json({ error: message }, 500);
  }
});

export default departments;
