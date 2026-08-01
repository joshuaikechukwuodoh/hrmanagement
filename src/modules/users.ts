import { db } from "@/db";
import { employeeProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get all employees
export const getAllEmployees = async () => {
  return await db.select().from(employeeProfiles);
};

// Get employee by user ID
export const getEmployeeByUserId = async (userId: string) => {
  const [employee] = await db
    .select()
    .from(employeeProfiles)
    .where(eq(employeeProfiles.userId, userId));

  return employee;
};

// Create employee profile
export const createEmployeeProfile = async (data: {
  userId: string;
  phone?: string;
  role?: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";
  departmentId?: string;
  hireDate?: string;
}) => {
  const [newProfile] = await db
    .insert(employeeProfiles)
    .values({
      id: crypto.randomUUID(),
      userId: data.userId,
      phone: data.phone,
      role: data.role || "EMPLOYEE",
      departmentId: data.departmentId,
      hireDate: data.hireDate,
      status: "ACTIVE",
    })
    .returning();

  return newProfile;
};

// Update employee profile
export const updateEmployeeProfile = async (
  userId: string,
  data: {
    phone?: string;
    role?: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";
    departmentId?: string;
    status?: string;
  }
) => {
  const [updated] = await db
    .update(employeeProfiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(employeeProfiles.userId, userId))
    .returning();

  return updated;
};