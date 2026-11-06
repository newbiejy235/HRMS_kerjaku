
import { z } from "zod";

export const payrollComponentsSchema = z.object({
  componentName: z
    .string()
    .trim()
    .min(3, "Nama komponen minimal 3 karakter")
    .max(100, "Nama komponen maksimal 100 karakter"),

  description: z
    .string()
    .trim()
    .max(500, "Deskripsi maksimal 500 karakter")
    .nullable()
    .optional(),

  type: z.enum(["earning", "deduction"], {
    error: "Tipe payroll harus earning atau deduction",
  }),
});

export const updatePayrollComponentsSchema =
  payrollComponentsSchema.partial();

export type PayrollComponentsInput = z.infer<
  typeof payrollComponentsSchema
>;

export type UpdatePayrollComponentsInput = z.infer<
  typeof updatePayrollComponentsSchema
>;


export const payrollAllocationsSchema = z.object({
  componentId: z
    .number()
    .int("Component ID harus berupa integer")
    .positive("Component ID harus lebih dari 0"),

  employeeId: z
    .string()
    .trim()
    .min(1, "Employee ID wajib diisi")
    .max(30, "Employee ID maksimal 30 karakter"),

  amount: z
    .number()
    .positive("Nominal harus lebih dari 0")
    .max(
      9999999999999.99,
      "Nominal melebihi batas maksimal",
    ),
});

export const updatePayrollAllocationsSchema = z.object({
  amount: z
    .number()
    .positive("Nominal harus lebih dari 0")
    .max(9999999999999.99, "Nominal melebihi batas maksimal"),
});

export type PayrollAllocationsInput = z.infer<
  typeof payrollAllocationsSchema
>;

export type UpdatePayrollAllocationsInput = z.infer<
  typeof updatePayrollAllocationsSchema
>;


export const payrollSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(1, "Employee ID wajib diisi")
    .max(30, "Employee ID maksimal 30 karakter"),

  payrollPeriod: z
    .string()
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])$/,
      "Format periode harus YYYY-MM",
    ),
});

export const updatePayrollSchema = z.object({
  totalEarnings: z
    .number()
    .nonnegative("Total earnings tidak boleh negatif")
    .optional(),

  totalDeductions: z
    .number()
    .nonnegative("Total deductions tidak boleh negatif")
    .optional(),

  netSalary: z
    .number()
    .nonnegative("Net salary tidak boleh negatif")
    .optional(),
});

export type PayrollInput = z.infer<typeof payrollSchema>;

export type UpdatePayrollInput = z.infer<
  typeof updatePayrollSchema
>;
