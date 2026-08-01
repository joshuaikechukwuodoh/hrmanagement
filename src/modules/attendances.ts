import { db } from "@/db";
import { attendances } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get all attendance records
export const getAllAttendances = async () => {
  return await db.select().from(attendances);
};

// Get attendance by user ID
export const getAttendanceByUserId = async (userId: string) => {
  return await db
    .select()
    .from(attendances)
    .where(eq(attendances.userId, userId));
};

// Create new attendance (Check-in)
export const createAttendance = async (data: {
  userId: string;
  date: string;
  checkIn?: string;
  status?: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
}) => {
  const [newAttendance] = await db
    .insert(attendances)
    .values({
      id: crypto.randomUUID(),
      userId: data.userId,
      date: data.date,
      checkIn: data.checkIn ? new Date(data.checkIn) : new Date(),
      status: data.status || "PRESENT",
    })
    .returning();

  return newAttendance;
};

// Update attendance (Check-out)
export const updateAttendance = async (
  id: string,
  data: {
    checkOut?: string;
    status?: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
  }
) => {
  const [updated] = await db
    .update(attendances)
    .set({
      checkOut: data.checkOut ? new Date(data.checkOut) : new Date(),
      status: data.status,
      updatedAt: new Date(),
    })
    .where(eq(attendances.id, id))
    .returning();

  return updated;
};