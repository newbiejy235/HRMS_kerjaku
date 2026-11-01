import { z } from "zod";

export const permissionSchema = z
  .object({
    permit_type: z.enum(["permission", "sick", "holiday"], {
      message: "Jenis izin tidak valid",
    }),

    permit_reason: z.string().optional(),

    start_date: z
      .string()
      .date()
      .refine((date) => date >= new Date().toISOString().slice(0, 10), {
        message: "Tanggal mulai tidak boleh sebelum hari ini",
      }),

    end_date: z.string().date(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
    path: ["end_date"],
  });

export type PermissionInput = z.infer<typeof permissionSchema>;
