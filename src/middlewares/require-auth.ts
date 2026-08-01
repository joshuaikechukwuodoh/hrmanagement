import type { MiddlewareHandler } from "hono";
import type { AuthVariables } from "@/middlewares/session";

export const requireAuth: MiddlewareHandler<{
  Variables: AuthVariables;
}> = async (c, next) => {
  const user = c.get("user");
  const session = c.get("session");

  if (!user || !session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};
