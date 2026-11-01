
import { z } from "zod";

export const permissionSchema = z
  .object({
    id_employee: z
      .string()
      .min(1, "ID karyawan wajib diisi")
      .max(30, "ID karyawan maksimal 30 karakter"),

    permit_type: z.enum(["permission", "sick", "holiday"], {
      message: "Jenis izin tidak valid",
    }),

    permit_reason: z
      .string()
      .optional(),

    start_date: z
      .string()
      .datetime({ message: "Format tanggal mulai tidak valid" }),

    end_date: z
      .string()
      .datetime({ message: "Format tanggal selesai tidak valid" }),

  })
  .refine(
    (data) => new Date(data.end_date) >= new Date(data.start_date),
    {
      message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
      path: ["end_date"],
    }
  );

export type PermissionInput = z.infer<typeof permissionSchema>;
