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