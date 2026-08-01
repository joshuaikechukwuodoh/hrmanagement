import {
  pgTable,
  text,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Enums
export const leaveTypeEnum = pgEnum("leave_type", [
  "ANNUAL",
  "SICK",
  "UNPAID",
  "MATERNITY",
  "PATERNITY",
  "OTHER",
]);

export const leaveStatusEnum = pgEnum("leave_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
]);

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "HR",
  "MANAGER",
  "EMPLOYEE",
]);

// Departments
export const departments = pgTable("departments", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Extend user with HR fields (we will link later)
export const employeeProfiles = pgTable("employee_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  phone: text("phone"),
  role: userRoleEnum("role").default("EMPLOYEE").notNull(),
  departmentId: text("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  hireDate: date("hire_date"),
  status: text("status").default("ACTIVE").notNull(), // ACTIVE, INACTIVE, TERMINATED
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leaves
export const leaves = pgTable("leaves", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: leaveTypeEnum("type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default("PENDING").notNull(),
  approvedBy: text("approved_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Attendances
export const attendances = pgTable("attendances", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  status: attendanceStatusEnum("status").default("PRESENT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents
export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  fileUrl: text("file_url").notNull(),
  type: text("type").notNull(), // CONTRACT, ID_CARD, CERTIFICATE, etc.
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});