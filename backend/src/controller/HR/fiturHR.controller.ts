import { db } from "../../config/db";
import { eq, and } from "drizzle-orm";
import {
  passwordResetRequests,
  usersTable,
  shiftSchedule,
  employeeAttendance,
} from "../../config/schema";
import { Request, Response, NextFunction } from "express";
import {
  createVerificationSchema,
  reviewVerificationSchema,
  hrReviewSchema,
} from "../../validation/verification.validation";
import { manageEmploye } from "../../validation/manageEmployee.validation";
import { attendanceSettings } from "../../config/schema";
import { shiftSettingsSchema } from "../../validation/shiftSettings.validation";
import {
  createShiftScheduleSchema,
  updateShiftScheduleSchema,
} from "../../validation/shiftSchedule.validation";
import { ZodError, number, z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { employes } from "../../config/schema";
import { bot } from "../../config/telegramBot";
import { AuthRequest } from "../../middleware/users.middleware";
import ExcelJS from "exceljs";

export class HRfeatures {
  // Generate 6-digit numeric token
  generateToken(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  VerificationForgetPassword = async (req: Request, res: Response) => {
    try {
      const requestValidation = createVerificationSchema.parse(req.body);
      const { userId } = requestValidation;

      // Validasi user exists - cek di database tanpa mengungkap apakah user terdaftar
      const existingUser = await db
        .select({ id: usersTable.id, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!existingUser.length) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      // Buat request baru dengan status pending
      const [makeRequest] = await db
        .insert(passwordResetRequests)
        .values({
          userId: userId,
          status: "pending",
        })
        .returning();

      if (!makeRequest) {
        return res.status(400).json({
          success: false,
          message: "Gagal membuat permintaan reset password",
        });
      }

      // Response generic - tidak mengungkap status request sebelum HR review
      return res.status(200).json({
        success: true,
        message:
          "Permintaan reset password telah dibuat dengan status pending. Menunggu review HR.",
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan sistem",
      });
    }
  };

  reviewForgetPassword = async (req: Request, res: Response) => {
    try {
      const { requestId, reviewedBy, status } = hrReviewSchema.parse(req.body);

      // Cari request yang masih pending
      const existingRequest = await db
        .select()
        .from(passwordResetRequests)
        .where(eq(passwordResetRequests.id, requestId))
        .limit(1);

      if (!existingRequest.length) {
        return res.status(404).json({
          success: false,
          message: "Request tidak ditemukan",
        });
      }

      // Cek jika request sudah diproses (bukan pending)
      if (existingRequest[0].status !== "pending") {
        return res.status(409).json({
          success: false,
          message: "Request sudah diproses sebelumnya",
        });
      }

      // Update status request
      await db
        .update(passwordResetRequests)
        .set({
          status: status,
          reviewedBy: reviewedBy,
          reviewedAt: new Date(),
        })
        .where(eq(passwordResetRequests.id, requestId));

      // Jika HR menyetujui, generate token dan simpan ke database
      if (status === "approved") {
        // 1. Cari akun Telegram karyawan
        const [employee] = await db
          .select({
            telegramChatId: employes.telegramChatId,
          })
          .from(employes)
          .where(eq(employes.userId, existingRequest[0].userId))
          .limit(1);

        // 2. Pastikan karyawan sudah menghubungkan Telegram
        if (!employee?.telegramChatId) {
          return res.status(400).json({
            success: false,
            message: "Karyawan belum menghubungkan akun Telegram",
          });
        }

        // 3. Buat OTP 6 digit
        const token = String(crypto.randomInt(100000, 1000000));

        // 4. Simpan hash OTP, bukan OTP asli
        const tokenHash = await bcrypt.hash(token, 10);

        // 5. Tentukan masa berlaku OTP: 10 menit
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 6. Simpan OTP ke database
        await db
          .update(passwordResetRequests)
          .set({
            status: "approved",
            token: tokenHash,
            expiresAt,
            usedAt: null,
            reviewedBy,
            reviewedAt: new Date(),
          })
          .where(eq(passwordResetRequests.id, requestId));

        // 7. Kirim OTP ke Telegram karyawan
        await bot.sendMessage(
          employee.telegramChatId,
          `Permintaan reset password Kerjaku telah disetujui oleh HR.\n\nKode OTP: ${token}\n\nKode berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.`,
        );

        return res.status(200).json({
          success: true,
          message: "Request disetujui dan OTP dikirim ke Telegram karyawan",
        });
      }

      // Jika HR menolak
      return res.status(200).json({
        success: true,
        message:
          "Request ditolak. Karyawan akan diberitahu permintaan ditolak.",
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.issues.map((issue: z.ZodIssue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mereview request",
      });
    }
  };

  getAllEmployee = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      // Validasi hak akses berdasarkan pengguna yang login
      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan mengakses data karyawan",
        });
      }

      // Ambil seluruh data karyawan beserta akun login
      const employees = await db
        .select({
          employeeId: employes.employeeId,
          firstName: employes.firstName,
          lastName: employes.lastName,
          gender: employes.gender,
          noTelp: employes.noTelp,
          hireDate: employes.hire_date,
          employmentStatus: employes.employment_status,
          email: usersTable.email,
          role: usersTable.role,
        })
        .from(employes)
        .innerJoin(usersTable, eq(employes.userId, usersTable.id));

      return res.status(200).json({
        success: true,
        message: "Berhasil mendapatkan data karyawan",
        data: employees,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Gagal mendapatkan data karyawan",
      });
    }
  };

  manageEmployee = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Sesi tidak valid" });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan mengakses data karyawan",
        });
      }

      const targetEmployeeId = String(req.params.employeeId);
      if (!targetEmployeeId) {
        return res
          .status(400)
          .json({ success: false, message: "ID Karyawan tidak valid" });
      }

      // Whitelist field yang boleh diubah HR, semuanya optional
      const updateSchema = manageEmploye
        .pick({
          firstName: true,
          lastName: true,
          gender: true,
          noTelp: true,
          noRek: true,
          cities_id: true,
          idPosition: true,
          idDepartment: true,
          // tambah/kurangi sesuai kebutuhan
        })
        .partial()
        .strict(); // tolak field yang tidak dikenal

      const validationResult = updateSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const validatedData = validationResult.data;

      if (Object.keys(validatedData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada data yang ingin diupdate",
        });
      }

      const [updated] = await db
        .update(employes)
        .set(validatedData)
        .where(eq(employes.employeeId, targetEmployeeId))
        .returning();

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Karyawan tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Berhasil update data karyawan",
        data: updated,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: "Terjadi kesalahan pada server" });
    }
  };

  employeeShiftSettings = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      // Validasi hak akses berdasarkan pengguna yang login
      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan mengakses data shift",
        });
      }

      const targetShift = Number(req.params.id_settings);
      if (!targetShift) {
        return res
          .status(400)
          .json({ success: false, message: "ID shift_settings tidak valid" });
      }

      const updateData = shiftSettingsSchema
        .pick({
          normal_time_in: true,
          normal_time_out: true,
        })
        .partial()
        .strict();
      const validationResult = updateData.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const validatedData = validationResult.data;

      if (Object.keys(validatedData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada data yang ingin diupdate",
        });
      }

      const [updated] = await db
        .update(attendanceSettings)
        .set(validatedData)
        .where(eq(attendanceSettings.id_settings, targetShift))
        .returning();

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "shift tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Berhasil update data karyawan",
        data: updated,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "internal server error",
      });
    }
  };
  createEmployeeShift = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Sesi tidak valid" });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan mengelola jadwal shift",
        });
      }

      const validationResult = createShiftScheduleSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const { shiftDate, shiftTime, employeeLocate, id_employee } =
        validationResult.data;

      // Pastikan karyawan terdaftar
      const [employee] = await db
        .select({ employeeId: employes.employeeId })
        .from(employes)
        .where(eq(employes.employeeId, id_employee))
        .limit(1);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Karyawan tidak ditemukan",
        });
      }

      // Pastikan pengaturan shift valid (shiftTime adalah ID referensi, bukan jam)
      const [shiftSetting] = await db
        .select({ idSettings: attendanceSettings.id_settings })
        .from(attendanceSettings)
        .where(eq(attendanceSettings.id_settings, shiftTime))
        .limit(1);

      if (!shiftSetting) {
        return res.status(404).json({
          success: false,
          message: "Pengaturan shift tidak ditemukan",
        });
      }

      // Cegah jadwal duplikat: karyawan, tanggal, dan shift yang sama
      const [duplicateShift] = await db
        .select({ shiftId: shiftSchedule.shiftId })
        .from(shiftSchedule)
        .where(
          and(
            eq(shiftSchedule.id_employee, id_employee),
            eq(shiftSchedule.shiftDate, shiftDate),
            eq(shiftSchedule.shiftTime, shiftTime),
          ),
        )
        .limit(1);

      if (duplicateShift) {
        return res.status(409).json({
          success: false,
          message:
            "Jadwal shift sudah terdaftar untuk karyawan pada tanggal tersebut",
        });
      }

      const [created] = await db
        .insert(shiftSchedule)
        .values({
          shiftDate,
          shiftTime,
          employeeLocate: employeeLocate ?? null,
          id_employee,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Berhasil membuat jadwal shift karyawan",
        data: created,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Gagal membuat jadwal shift karyawan",
      });
    }
  };

  updateEmployeeShift = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Sesi tidak valid" });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan mengelola jadwal shift",
        });
      }

      const targetShiftId = Number(req.params.shiftId);
      if (!Number.isInteger(targetShiftId) || targetShiftId <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "ID shift tidak valid" });
      }

      // Whitelist: HR hanya boleh mengubah shiftDate, shiftTime, dan employeeLocate
      const validationResult = updateShiftScheduleSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const validatedData = validationResult.data;

      if (
        validatedData.shiftDate === undefined &&
        validatedData.shiftTime === undefined &&
        validatedData.employeeLocate === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada data yang ingin diupdate",
        });
      }

      const [existingShift] = await db
        .select({
          shiftId: shiftSchedule.shiftId,
          shiftDate: shiftSchedule.shiftDate,
          shiftTime: shiftSchedule.shiftTime,
          employeeLocate: shiftSchedule.employeeLocate,
          id_employee: shiftSchedule.id_employee,
        })
        .from(shiftSchedule)
        .where(eq(shiftSchedule.shiftId, targetShiftId))
        .limit(1);

      if (!existingShift) {
        return res.status(404).json({
          success: false,
          message: "Jadwal shift tidak ditemukan",
        });
      }

      // Bangun object update secara eksplisit (tidak spread req.body)
      const updateData: {
        shiftDate?: string;
        shiftTime?: number;
        upcomingShiftDate?: string | null;
        upcomingShiftTime?: number | null; // <-- was string | null
        employeeLocate?: string | null;
      } = {};

      if (validatedData.shiftDate !== undefined) {
        updateData.shiftDate = validatedData.shiftDate;
      }

      if (validatedData.shiftTime !== undefined) {
        updateData.shiftTime = validatedData.shiftTime;
      }

      if (validatedData.employeeLocate !== undefined) {
        updateData.employeeLocate = validatedData.employeeLocate;
      }
      if (validatedData.upcomingShiftDate !== undefined) {
        updateData.upcomingShiftDate = validatedData.upcomingShiftDate;
      }
      if (validatedData.upcomingShiftTime !== undefined) {
        updateData.upcomingShiftTime = validatedData.upcomingShiftTime;
      }

      // Validasi FK jika shiftTime diperbarui
      if (updateData.shiftTime !== undefined) {
        const [shiftSetting] = await db
          .select({ idSettings: attendanceSettings.id_settings })
          .from(attendanceSettings)
          .where(eq(attendanceSettings.id_settings, updateData.shiftTime))
          .limit(1);

        if (!shiftSetting) {
          return res.status(404).json({
            success: false,
            message: "Pengaturan shift tidak ditemukan",
          });
        }
      }

      // Cegah duplikat jika tanggal atau shift diperbarui:
      // bandingkan tanggal & shift efektif terhadap jadwal lain milik karyawan yang sama
      if (
        updateData.shiftDate !== undefined ||
        updateData.shiftTime !== undefined
      ) {
        const effectiveDate = updateData.shiftDate ?? existingShift.shiftDate;
        const effectiveTime = updateData.shiftTime ?? existingShift.shiftTime;

        const [duplicateShift] = await db
          .select({ shiftId: shiftSchedule.shiftId })
          .from(shiftSchedule)
          .where(
            and(
              eq(shiftSchedule.id_employee, existingShift.id_employee),
              eq(shiftSchedule.shiftDate, effectiveDate),
              eq(shiftSchedule.shiftTime, effectiveTime),
            ),
          )
          .limit(1);

        if (duplicateShift && duplicateShift.shiftId !== targetShiftId) {
          return res.status(409).json({
            success: false,
            message:
              "Jadwal shift sudah terdaftar untuk karyawan pada tanggal tersebut",
          });
        }
      }

      const [updated] = await db
        .update(shiftSchedule)
        .set(updateData)
        .where(eq(shiftSchedule.shiftId, targetShiftId))
        .returning();

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Jadwal shift tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Berhasil update jadwal shift karyawan",
        data: updated,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Gagal update jadwal shift karyawan",
      });
    }
  };

  getAllShiftSchedules = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Sesi tidak valid" });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan melihat jadwal shift karyawan",
        });
      }

      const shiftSchedules = await db
        .select({
          shiftId: shiftSchedule.shiftId,
          shiftDate: shiftSchedule.shiftDate,
          employeeLocate: shiftSchedule.employeeLocate,
          category: attendanceSettings.category,
          normal_time_in: attendanceSettings.normal_time_in,
          normal_time_out: attendanceSettings.normal_time_out,
          employeeId: employes.employeeId,
          firstName: employes.firstName,
          lastName: employes.lastName,
        })
        .from(shiftSchedule)
        .innerJoin(
          attendanceSettings,
          eq(shiftSchedule.shiftTime, attendanceSettings.id_settings),
        )
        .innerJoin(employes, eq(shiftSchedule.id_employee, employes.employeeId))
        .orderBy(shiftSchedule.shiftDate);

      return res.status(200).json({
        success: true,
        message: "Berhasil mendapatkan jadwal shift karyawan",
        data: shiftSchedules,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Gagal mendapatkan jadwal shift karyawan",
      });
    }
  };

  getAllAttendanceEmployee = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Sesi tidak valid" });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan melihat jadwal shift karyawan",
        });
      }

      const data = await db.select().from(employeeAttendance);
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          message: "data absensi masih kosong",
        });
      }

      return res.status(200).json({
        success: true,
        message: "berhasil mendapatkan semua data kehadiran karyawan",
        data: {
          data,
        },
      });
    } catch (error) {}
  };

  exportExcel = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Sesi tidak valid" });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan melihat jadwal shift karyawan",
        });
      }

      // 1. Ambil data dari database
      const data = await db.select().from(employeeAttendance);

      // 2. Buat workbook
      const workbook = new ExcelJS.Workbook();

      // 3. Buat worksheet
      const worksheet = workbook.addWorksheet("Data Karyawan");

      // 4. Buat kolom
      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Tanggal masuk", key: "tanggal", width: 30 },
        { header: "absensi masuk", key: "absenMasuk", width: 35 },
        { header: "absensi keluar", key: "absenKeluar", width: 35 },
        { header: "kode karyawan", key: "code", width: 50 },
      ];

      // 5. Masukkan data
      data.forEach((attendance) => {
        worksheet.addRow({
          id: attendance.shiftId,
          tanggal: attendance.shiftDate,
          absenMasuk: attendance.employeeIn,
          absenKeluar: attendance.employeeOut,
          code: attendance.id_employee,
        });
      });

      // 6. Kirim file ke client
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="data-karyawan.xlsx"',
      );

      await workbook.xlsx.write(res);

      res.end();
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Gagal melakukan export Excel",
      });
    }
  };
}

export default new HRfeatures();
