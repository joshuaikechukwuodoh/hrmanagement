import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get all documents
export const getAllDocuments = async () => {
  return await db.select().from(documents);
};

// Get documents by user ID
export const getDocumentsByUserId = async (userId: string) => {
  return await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId));
};

// Create document
export const createDocument = async (data: {
  userId: string;
  title: string;
  fileUrl: string;
  type: string;
}) => {
  const [newDocument] = await db
    .insert(documents)
    .values({
      id: crypto.randomUUID(),
      userId: data.userId,
      title: data.title,
      fileUrl: data.fileUrl,
      type: data.type,
    })
    .returning();

  if (!newDocument) {
    throw new Error("Failed to create document");
  }

  return newDocument;
};

// Delete document
export const deleteDocument = async (id: string) => {
  await db.delete(documents).where(eq(documents.id, id));
  return { message: "Document deleted successfully" };
};