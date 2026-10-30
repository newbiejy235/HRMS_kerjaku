import { z } from "zod";

const shiftDateField = z.iso.date("Format shift date harus YYYY-MM-DD");

const shiftTimeField = z
  .number()
  .int("Shift time harus berupa bilangan bulat")
  .positive("Shift time harus lebih dari 0");

const employeeLocateField = z
  .string()
  .trim()
  .max(1000, "Lokasi kerja maksimal 1000 karakter")
  .nullable();

const idEmployeeField = z
  .string()
  .trim()
  .min(1, "Employee code wajib diisi")
  .max(30, "Employee code maksimal 30 karakter");

// Validasi untuk insert jadwal shift karyawan
export const createShiftScheduleSchema = z
  .object({
    shiftDate: shiftDateField,
    shiftTime: shiftTimeField,
    employeeLocate: employeeLocateField.optional(),
    id_employee: idEmployeeField,
  })
  .strict();

// Validasi untuk update jadwal shift karyawan
// HR hanya boleh mengubah shiftDate, shiftTime, dan employeeLocate
// shiftId hanya untuk identifikasi jadwal via params, id_employee tidak boleh diubah
export const updateShiftScheduleSchema = z
  .object({
    shiftDate: shiftDateField.optional(),
    shiftTime: shiftTimeField.optional(),
    employeeLocate: employeeLocateField.optional(),
  })
  .strict();
