import {
  date,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
  text,
  time,
  numeric,
  uniqueIndex,
  serial,
  doublePrecision,
  boolean,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("userRole", ["Karyawan", "Finance", "HR"]);
export const employmentStatusEnum = pgEnum("employment_status", [
  "active",
  "fired",
]);

export const gender_status = pgEnum("gender", ["L", "P"]);
export const shiftCategory = pgEnum("shiftCategory", [
  "Morning",
  "Afternoon",
  "Evening",
]);

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
  telegramChatId: varchar("telegram_chat_id", { length: 100 }),
  telegramPairingToken: varchar("telegram_pairing_token", {
    length: 64,
  }).unique(),

  telegramPairingExpiresAt: timestamp("telegram_pairing_expires_at", {
    mode: "date",
  }),
  cities_id: integer()
    .notNull()
    .references(() => cities.id),
  noRek: varchar({ length: 100 }).notNull(),
  nip: varchar({ length: 100 }).notNull(),
  BPJS_Kesehatan: varchar({ length: 100 }),
  BPJS_Ketenagakerjaan: varchar({ length: 100 }),
  NPWP : varchar({length : 16}),
  hire_date: date("hire_date").notNull(),
  resign_date: date("resign_date"),
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

export const resetRequestStatus = pgEnum("reset_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const passwordResetRequests = pgTable("password_reset_requests", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),

  status: resetRequestStatus().notNull().default("pending"),

  reviewedBy: integer("reviewed_by").references(() => usersTable.id),

  token: varchar("token", { length: 255 }),

  expiresAt: timestamp("expires_at", { withTimezone: true }),

  usedAt: timestamp("used_at", { withTimezone: true }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  reviewedAt: timestamp("reviewed_at", {
    withTimezone: true,
  }),
});

export const attendanceStatus = pgEnum("attendance_status", [
  "on time",
  "late",
  "tolerance time",
]);

export const employeeAttendance = pgTable("attendance", {
  shiftId: integer().primaryKey().generatedAlwaysAsIdentity(),
  shiftDate: date().notNull(),
  employeeIn: time(),
  employeeOut: time(),
  employeeLocate: text(),
  status: attendanceStatus(),
  id_employee: varchar()
    .notNull()
    .references(() => employes.employeeId),
});

export const attendanceSettings = pgTable("attendance_settings", {
  id_settings: integer().primaryKey().generatedAlwaysAsIdentity(),
  category: shiftCategory().notNull(),
  normal_time_in: time(),
  normal_time_out: time(),
  tolerance_time: time(),
});

export const shiftSchedule = pgTable(
  "shift",
  {
    shiftId: integer().primaryKey().generatedAlwaysAsIdentity(),

    shiftDate: date().notNull(),

    shiftTime: integer()
      .notNull()
      .references(() => attendanceSettings.id_settings),

    upcomingShiftDate: date(),

    upcomingShiftTime: integer().references(
      () => attendanceSettings.id_settings,
    ),

    employeeLocate: text(),

    id_employee: varchar({ length: 30 })
      .notNull()
      .references(() => employes.employeeId),
  },
  (table) => [
    uniqueIndex("employee_shift_date_unique").on(
      table.id_employee,
      table.shiftDate,
    ),
  ],
);

export const attendanceQrCode = pgTable("qr_code", {
  id_qrCode: integer().primaryKey().generatedAlwaysAsIdentity(),
  qrCodeToken: varchar({ length: 100 }).notNull(),
  expiredAt: timestamp("expires_at", {
    withTimezone: true,
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow(),
});

export const permissionType = pgEnum("permissionType", [
  "permission",
  "sick",
  "holiday",
]);

export const permissionStatus = pgEnum("status", [
  "pending",
  "rejected",
  "accepted",
]);

export const employeePermission = pgTable("permission", {
  id_permission: integer().primaryKey().generatedAlwaysAsIdentity(),
  id_employee: varchar({ length: 30 })
    .notNull()
    .references(() => employes.employeeId),
  permit_type: permissionType().notNull(),
  permit_reason: text(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  status: permissionStatus().notNull().default("pending"),
  approved_by: integer().references(() => usersTable.id),
});

export const overtime = pgTable("overtime", {
  id_overwork: integer().primaryKey().generatedAlwaysAsIdentity(),
  id_employee: varchar({ length: 30 })
    .notNull()
    .references(() => employes.employeeId),
  overtimeDate: timestamp().notNull(),
  overtimeTotal: integer().notNull(),
  description: text(),
  status: permissionStatus().notNull().default("pending"),
  approved_by: integer().references(() => usersTable.id),
});

// payroll

export const payrollType = pgEnum("payrollType", ["earning", "deduction"]);

export const payrollComponents = pgTable("payroll_components", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  componentName: varchar("component_name", {
    length: 100,
  })
    .notNull()
    .unique(),

  description: text("description"),

  type: payrollType().notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeePayrollAllocations = pgTable(
  "employee_payroll_allocations",
  {
    allocationId: integer().primaryKey().generatedAlwaysAsIdentity(),

    componentId: integer("component_id")
      .notNull()
      .references(() => payrollComponents.id),

    employeeId: varchar("employee_id", {
      length: 30,
    })
      .notNull()
      .references(() => employes.employeeId),

    amount: numeric("amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
  },
  (table) => [
    uniqueIndex("employee_component_unique").on(
      table.employeeId,
      table.componentId,
    ),
  ],
);

export const payrolls = pgTable(
  "payrolls",
  {
    payrollId: integer().primaryKey().generatedAlwaysAsIdentity(),

    employeeId: varchar("employee_id", {
      length: 30,
    })
      .notNull()
      .references(() => employes.employeeId),

    payrollPeriod: varchar("payroll_period", {
      length: 7,
    }).notNull(),

    totalEarnings: numeric("total_earnings", {
      precision: 15,
      scale: 2,
    })
      .notNull()
      .default("0"),

    totalDeductions: numeric("total_deductions", {
      precision: 15,
      scale: 2,
    })
      .notNull()
      .default("0"),

    netSalary: numeric("net_salary", {
      precision: 15,
      scale: 2,
    })
      .notNull()
      .default("0"),
  },
  (table) => [
    uniqueIndex("employee_payroll_period_unique").on(
      table.employeeId,
      table.payrollPeriod,
    ),
  ],
);

export const payrollDetails = pgTable("payroll_details", {
  detailId: integer().primaryKey().generatedAlwaysAsIdentity(),

  payrollId: integer()
    .notNull()
    .references(() => payrolls.payrollId),

  componentId: integer()
    .notNull()
    .references(() => payrollComponents.id),

  componentName: varchar("component_name", {
    length: 100,
  }).notNull(),

  type: payrollType().notNull(),

  amount: numeric("amount", {
    precision: 15,
    scale: 2,
  }).notNull(),
});

export const employeeAttendanceStatistics = pgTable(
  "employee_attendance_statistics",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    employeeId: varchar("employee_id", { length: 30 })
      .notNull()
      .references(() => employes.employeeId),

    month: integer("month").notNull(),
    year: integer("year").notNull(),

    totalEffectiveDays: integer("total_effective_days").notNull().default(0),

    totalPresent: integer("total_present").notNull().default(0),

    totalAlpha: integer("total_alpha").notNull().default(0),

    totalPermission: integer("total_permission").notNull().default(0),

    totalOvertime: integer("total_overtime").notNull().default(0),

    totalLate: integer("total_late").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("employee_attendance_statistics_unique").on(
      table.employeeId,
      table.month,
      table.year,
    ),
  ],
);

export const attendanceLocation = pgTable("attendance_location", {
  id: serial("id").primaryKey(),

  locationName: varchar("location_name", {
    length: 100,
  }).notNull(),

  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),

  radiusMeter: integer("radius_meter").notNull().default(100),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reimbursementStatus = pgEnum("reimbursement_status", [
  "pending",
  "approved",
  "rejected",
]);

export const employeeReimbursements = pgTable("employee_reimbursements", {
  id: serial("id").primaryKey(),

  // Karyawan yang mengajukan
  employeeId: varchar("employee_id")
    .notNull()
    .references(() => employes.employeeId, {
      onDelete: "cascade",
    }),

  // Informasi pengajuan
  name: varchar("name", { length: 255 }).notNull(),

  description: text("description"),

  amount: numeric("amount", {
    precision: 12,
    scale: 2,
  }).notNull(),

  // Foto bukti transaksi
  receiptPhoto: text("receipt_photo"),

  expenseDate: date("expense_date").notNull(),

  // Status pengajuan
  status: reimbursementStatus("status").default("pending").notNull(),

  // Review oleh HR
  reviewBy: integer("review_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),

  reviewedAt: timestamp("reviewed_at"),

  rejectionReason: text("rejection_reason"),

  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
