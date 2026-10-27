import {
  date,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
  text,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("userRole", ["Karyawan", "Finance", "HR"]);
export const employmentStatusEnum = pgEnum("employment_status", [
  "active",
  "fired",
]);

export const gender_status = pgEnum("gender", ["L", "P"]);

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 100 }).notNull(),
  role: userRole("userRole").notNull().default("Karyawan"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const provinces = pgTable("provinces_table", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  provinsi: varchar({ length: 100 }).notNull(),
});

export const cities = pgTable("cities", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  kota: varchar({ length: 255 }).notNull(),
  provinsi_id: integer()
    .notNull()
    .references(() => provinces.id),
});

export const employes = pgTable("employes", {
  employeeId: varchar("employee_code", { length: 30 }).notNull().primaryKey(),
  userId: integer()
    .notNull()
    .unique()
    .references(() => usersTable.id),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }),
  gender: gender_status("gender").notNull(),
  noTelp: varchar("no_telp", { length: 20 }),
  cities_id: integer()
    .notNull()
    .references(() => cities.id),
  noRek: varchar({ length: 100 }),
  hire_date: date("hire_date").notNull(),
  resign_date: date("hire_date"),
  idPosition: integer("id_position")
    .notNull()
    .references(() => position.id_position),

  idDepartment: integer("id_department")
    .notNull()
    .references(() => department.id_department),
  employment_status: employmentStatusEnum("employment_status")
    .notNull()
    .default("active"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const position = pgTable("position", {
  id_position: integer().primaryKey().generatedAlwaysAsIdentity(),
  position_name: varchar({ length: 100 }).notNull(),
  description: text(),
});

export const department = pgTable("department", {
  id_department: integer().primaryKey().generatedAlwaysAsIdentity(),
  department_name: varchar({ length: 100 }).notNull(),
  description: text(),
});
