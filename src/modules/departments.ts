import { db } from "@/db";
import { departments, employeeProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get all departments
export const getAllDepartments = async () => {
  return await db.select().from(departments);
};

// Create department
export const createDepartment = async (name: string) => {
  const [newDepartment] = await db
    .insert(departments)
    .values({
      id: crypto.randomUUID(),
      name,
    })
    .returning();

  return newDepartment;
};

// Update department
export const updateDepartment = async (id: string, name: string) => {
  const [updated] = await db
    .update(departments)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(eq(departments.id, id))
    .returning();

  return updated;
};

// Delete department (unassign employees first so FK does not block delete)
export const deleteDepartment = async (id: string) => {
  const [existing] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, id));

  if (!existing) {
    return null;
  }

  await db
    .update(employeeProfiles)
    .set({ departmentId: null, updatedAt: new Date() })
    .where(eq(employeeProfiles.departmentId, id));

  await db.delete(departments).where(eq(departments.id, id));
  return { message: "Department deleted successfully" };
};