import { z } from "zod";

export const overtimeSchema = z.object({
  overtimeDate: z.string().datetime({
    local: true,
    message: "Format tanggal dan waktu tidak valid",
  }),

  overtimeTotal: z.number().int().positive({
    message: "Total lembur harus berupa angka positif",
  }),

  description: z.string().optional(),
});

export const overtimeHRSchema = z.object({
  id_employee: z
    .string()
    .trim()
    .min(1, "Employee code wajib diisi")
    .max(30, "Employee code maksimal 30 karakter"),

  overtimeDate: z.string().datetime({
    local: true,
    message: "Format tanggal dan waktu tidak valid",
  }),

  overtimeTotal: z.number().int().positive({
    message: "Total lembur harus berupa angka positif",
  }),

  description: z.string().optional(),

});
