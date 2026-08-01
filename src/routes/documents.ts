import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AuthVariables } from "@/middlewares/session";
import { requireAuth } from "@/middlewares/require-auth";
import {
  createDocument,
  deleteDocument,
  getAllDocuments,
  getDocumentsByUserId,
} from "@/modules/documents";

const documents = new Hono<{ Variables: AuthVariables }>();

documents.use("*", requireAuth);

documents.get("/", async (c) => {
  const userId = c.req.query("userId");
  const data = userId
    ? await getDocumentsByUserId(userId)
    : await getAllDocuments();
  return c.json({ data });
});

documents.get("/me", async (c) => {
  const user = c.get("user")!;
  const data = await getDocumentsByUserId(user.id);
  return c.json({ data });
});

documents.post(
  "/",
  zValidator(
    "json",
    z.object({
      userId: z.string().min(1).optional(),
      title: z.string().min(1).max(200),
      fileUrl: z.string().min(1),
      type: z.string().min(1).max(50),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user")!;
    try {
      const data = await createDocument({
        userId: body.userId ?? user.id,
        title: body.title,
        fileUrl: body.fileUrl,
        type: body.type,
      });
      return c.json({ data }, 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create document";
      if (message.includes("foreign key") || message.includes("violates")) {
        return c.json({ error: "Invalid userId" }, 400);
      }
      return c.json({ error: message }, 500);
    }
  },
);

documents.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await deleteDocument(id);
  return c.json({ message: "Document deleted successfully" });
});

export default documents;
