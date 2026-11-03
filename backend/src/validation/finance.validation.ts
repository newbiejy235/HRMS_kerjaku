import { z } from "zod";

// A. Payroll Component Validation
export const createPayrollComponentSchema = z.object({
  componentName: z
    .string()
    .trim()
    .min(1, "Nama komponen wajib diisi")
    .max(100, "Nama komponen maksimal 100 karakter"),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional()
    .nullable(),
});

// B. Employee Payroll Component Validation
export const createEmployeePayrollComponentSchema = z.object({
  payrollComponentId: z
    .number()
    .int("Payroll Component ID harus berupa integer")
    .positive("Payroll Component ID harus positif"),
  amount: z
    .number()
    .int("Nominal harus berupa integer")
    .min(0, "Nominal tidak boleh negatif"),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional()
    .nullable(),
});

export const updateEmployeePayrollComponentSchema = z
  .object({
    payrollComponentId: z
      .number()
      .int("Payroll Component ID harus berupa integer")
      .positive("Payroll Component ID harus positif")
      .optional(),
    amount: z
      .number()
      .int("Nominal harus berupa integer")
      .min(0, "Nominal tidak boleh negatif")
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, "Deskripsi maksimal 1000 karakter")
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk memperbarui data",
  });

// C. Payroll Allocation Validation
export const createPayrollAllocationSchema = z.object({
  componentId: z
    .number()
    .int("Component ID harus berupa integer")
    .positive("Component ID harus positif"),
  employeeId: z
    .string()
    .trim()
    .min(1, "Employee ID wajib diisi")
    .max(30, "Employee ID maksimal 30 karakter"),
  amount: z
    .union([z.number(), z.string()], {
      error: "Nominal alokasi wajib diisi",
    })
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      },
      { message: "Nominal alokasi harus berupa angka valid dan tidak boleh negatif" },
    ),
});

export const updatePayrollAllocationSchema = z
  .object({
    componentId: z
      .number()
      .int("Component ID harus berupa integer")
      .positive("Component ID harus positif")
      .optional(),
    employeeId: z
      .string()
      .trim()
      .min(1, "Employee ID wajib diisi")
      .max(30, "Employee ID maksimal 30 karakter")
      .optional(),
    amount: z
      .union([z.number(), z.string()])
      .refine(
        (val) => {
          const num = Number(val);
          return !isNaN(num) && num >= 0;
        },
        { message: "Nominal alokasi harus berupa angka valid dan tidak boleh negatif" },
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk memperbarui data",
  });

// D. Payroll & Payroll Details Validation
export const createPayrollSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(1, "Employee ID wajib diisi")
    .max(30, "Employee ID maksimal 30 karakter"),
  payrollPeriod: z
    .string()
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Format periode harus YYYY-MM (contoh: 2026-11)"),
});

export const createPayrollDetailSchema = z.object({
  payrollId: z
    .number()
    .int("Payroll ID harus berupa integer")
    .positive("Payroll ID harus positif"),
  componentId: z
    .number()
    .int("Component ID harus berupa integer")
    .positive("Component ID harus positif"),
  amount: z
    .union([z.number(), z.string()], {
      error: "Nominal detail wajib diisi",
    })
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      },
      { message: "Nominal detail harus berupa angka valid dan tidak boleh negatif" },
    ),
  type: z
    .enum(["earning", "deduction"], {
      error: "Tipe komponen harus 'earning' atau 'deduction'",
    })
    .default("earning"),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional()
    .nullable(),
});

export const updatePayrollDetailSchema = z
  .object({
    componentId: z
      .number()
      .int("Component ID harus berupa integer")
      .positive("Component ID harus positif")
      .optional(),
    amount: z
      .union([z.number(), z.string()])
      .refine(
        (val) => {
          const num = Number(val);
          return !isNaN(num) && num >= 0;
        },
        { message: "Nominal detail harus berupa angka valid dan tidak boleh negatif" },
      )
      .optional(),
    type: z
      .enum(["earning", "deduction"], {
        error: "Tipe komponen harus 'earning' atau 'deduction'",
      })
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, "Deskripsi maksimal 1000 karakter")
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk memperbarui data",
  });

// HR Payroll Approval Validation
export const hrApprovalPayrollSchema = z.object({
  payrollId: z
    .number()
    .int("Payroll ID harus berupa integer")
    .positive("Payroll ID harus positif"),
  status: z.enum(["accepted", "rejected"], {
    error: "Status approval harus 'accepted' atau 'rejected'",
  }),
});
