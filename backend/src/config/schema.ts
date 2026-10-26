import {
  date,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("userRole", ["Karyawan", "Finance", "HR"]);
export const employmentStatusEnum = pgEnum("employment_status", [
  "active",
  "fired",
]);

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  employe_id: integer()
    .notNull()
    .unique()
    .references(() => employes.id),
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
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  employeeCode: varchar("employee_code", { length: 30 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }),
  noTelp: varchar("no_telp", { length: 20 }),
  cities_id: integer()
    .notNull()
    .references(() => cities.id),
  hire_date: date("hire_date").notNull(),
  employment_status: employmentStatusEnum("employment_status").notNull().default("active"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
