import { z } from "zod";

export const employe = z.object({
  employeeId: z
    .string()
    .min(1, "Employee code wajib diisi")
    .max(30, "Employee code maksimal 30 karakter"),

  userId: z
    .number()
    .int("User ID harus berupa bilangan bulat")
    .positive("User ID harus lebih dari 0"),

  firstName: z
    .string()
    .trim()
    .min(1, "Nama depan wajib diisi")
    .max(255, "Nama depan maksimal 255 karakter"),

  lastName: z
    .string()
    .trim()
    .max(255, "Nama belakang maksimal 255 karakter")
    .optional()
    .nullable(),

  gender: z.enum(["L", "P"], {
    error: "Gender harus L atau P",
  }),

  noTelp: z
    .string()
    .trim()
    .min(10, "Nomor telepon minimal 10 karakter")
    .max(13, "Nomor telepon maksimal 13 karakter")
    .regex(/^[0-9]+$/, "Nomor telepon hanya boleh berisi angka"),

  cities_id: z
    .number()
    .int("City ID harus berupa bilangan bulat")
    .positive("City ID harus lebih dari 0"),

  noRek: z
    .string()
    .trim()
    .min(10, "Nomor rekening minimal 10 karakter")
    .max(100, "Nomor rekening maksimal 100 karakter"),

  nip: z
    .string()
    .trim()
    .min(10, "NIP minimal 10 karakter")
    .max(100, "NIP maksimal 100 karakter"),

  hire_date: z
    .iso
    .date("Format hire date harus YYYY-MM-DD"),

  resign_date: z
    .iso
    .date("Format resign date harus YYYY-MM-DD")
    .optional()
    .nullable(),

  idPosition: z
    .number()
    .int("Position ID harus berupa bilangan bulat")
    .positive("Position ID harus lebih dari 0"),

  idDepartment: z
    .number()
    .int("Department ID harus berupa bilangan bulat")
    .positive("Department ID harus lebih dari 0"),

  employment_status: z
    .enum(["active", "fired"], {
      error: "Status karyawan harus active atau fired",
    })
    .default("active"),
});

export type EmployeInput = z.infer<typeof employe>;