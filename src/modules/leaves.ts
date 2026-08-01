import { db } from "@/db";
import { leaves } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get all leaves
export const getAllLeaves = async () => {
  return await db.select().from(leaves);
};

// Get leaves by user ID
export const getLeavesByUserId = async (userId: string) => {
  return await db
    .select()
    .from(leaves)
    .where(eq(leaves.userId, userId));
};

// Create leave request
export const createLeave = async (data: {
  userId: string;
  type: "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "PATERNITY" | "OTHER";
  startDate: string;
  endDate: string;
  reason?: string;
}) => {
  const [newLeave] = await db
    .insert(leaves)
    .values({
      id: crypto.randomUUID(),
      userId: data.userId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: "PENDING",
    })
    .returning();

  return newLeave;
};

// Update leave status (Approve / Reject)
export const updateLeaveStatus = async (
  id: string,
  status: "APPROVED" | "REJECTED" | "CANCELLED",
  approvedBy?: string
) => {
  const [updated] = await db
    .update(leaves)
    .set({
      status,
      approvedBy,
      updatedAt: new Date(),
    })
    .where(eq(leaves.id, id))
    .returning();

  return updated;
};