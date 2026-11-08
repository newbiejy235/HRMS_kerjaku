import { db } from "../../config/db";
import { eq, and, sql, asc, gte, lte, lt } from "drizzle-orm";

import {
  passwordResetRequests,
  usersTable,
  shiftSchedule,
  employeeAttendance,
  cities,
  provinces,
  position,
  department,
  overtime,
  employeePayrollAllocations,
  payrollComponents,
  payrolls,
  payrollDetails,
  employeeAttendanceStatistics,
} from "../../config/schema";
import { Request, Response, NextFunction } from "express";
import {
  payrollAllocationsSchema,
  payrollComponentsSchema,
  payrollSchema,
  updatePayrollAllocationsSchema,
  updatePayrollComponentsSchema,
} from "../../validation/finance.validation";
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
import { employeePermission } from "../../config/schema";
import {
  DEFAULT_EFFECTIVE_DAYS,
  formatDate,
  fromCents,
  getPeriod,
  toCents,
} from "../../lib/utils";
import {
  overtimeSchema,
  overtimeHRSchema,
} from "../../validation/overtime.validation";
import TelegramService from "../../services/notification.service";
import { alias } from "drizzle-orm/pg-core";
import { ne } from "drizzle-orm";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fmtTime = (t: string | null) => (t ? t.slice(0, 5) : "-");

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

  reviewForgetPassword = async (req: AuthRequest, res: Response) => {
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

      const [isHR] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, user.userId));

      const { requestId, status } = hrReviewSchema.parse(req.body);

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
          reviewedBy: isHR.id,
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
            reviewedBy: isHR.id,
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
          BPJS_Kesehatan: true,
          BPJS_Ketenagakerjaan: true,
          NPWP: true,
          employment_status: true,
          resign_date: true,
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
          tolerance_time: true,
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

      const {
        shiftDate,
        shiftTime,
        employeeLocate,
        id_employee,
        upcomingShiftDate,
        upcomingShiftTime,
      } = validationResult.data;

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
          upcomingShiftDate,
          upcomingShiftTime,
          employeeLocate: employeeLocate ?? null,
          id_employee,
        })
        .returning();

      const [data] = await db
        .select()
        .from(employes)
        .where(eq(employes.employeeId, id_employee));

      if (data.telegramChatId) {
        const currentSetting = alias(attendanceSettings, "current_setting");
        const upcomingSetting = alias(attendanceSettings, "upcoming_setting");

        const [info] = await db
          .select({
            firstName: employes.firstName,
            telegramChatId: employes.telegramChatId,
            shiftDate: shiftSchedule.shiftDate,
            shiftCategory: currentSetting.category,
            shiftIn: currentSetting.normal_time_in,
            shiftOut: currentSetting.normal_time_out,
            upcomingShiftDate: shiftSchedule.upcomingShiftDate,
            upcomingCategory: upcomingSetting.category,
            upcomingIn: upcomingSetting.normal_time_in,
            upcomingOut: upcomingSetting.normal_time_out,
          })
          .from(shiftSchedule)
          .innerJoin(
            employes,
            eq(employes.employeeId, shiftSchedule.id_employee),
          )
          .innerJoin(
            currentSetting,
            eq(currentSetting.id_settings, shiftSchedule.shiftTime),
          )
          .leftJoin(
            upcomingSetting,
            eq(upcomingSetting.id_settings, shiftSchedule.upcomingShiftTime),
          )
          .where(eq(shiftSchedule.shiftId, created.shiftId));

        const upcomingText = info.upcomingShiftDate
          ? [
              `📆 Tanggal: ${info.upcomingShiftDate}`,
              `⏱️ Shift: ${info.upcomingCategory} (${fmtTime(info.upcomingIn)} - ${fmtTime(info.upcomingOut)})`,
            ].join("\n")
          : "Belum ada jadwal shift selanjutnya";

        const message = [
          "<b>Jadwal shift kamu</b>",
          "",
          `Haloo ${escapeHtml(info.firstName)} 👋`,
          "",
          "Jadwal shift kamu saat ini:",
          `📆 Tanggal: ${info.shiftDate}`,
          `⏱️ Shift: ${info.shiftCategory} (${fmtTime(info.shiftIn)} - ${fmtTime(info.shiftOut)})`,
          "",
          "Perkiraan pergantian shift yang akan datang:",
          upcomingText,
          "",
          "<b>Jangan sampai terlambat ya, ditunggu kehadirannya 😁</b>",
        ].join("\n");

        await TelegramService.sendMessage(data.telegramChatId, message);
      }

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

      const validationResult = updateShiftScheduleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const validatedData = validationResult.data;

      if (Object.values(validatedData).every((v) => v === undefined)) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada data yang ingin diupdate",
        });
      }

      const [existingShift] = await db
        .select({
          shiftId: shiftSchedule.shiftId,
          shiftDate: shiftSchedule.shiftDate,
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
        upcomingShiftDate?: string;
        upcomingShiftTime?: number;
        employeeLocate?: string | null;
      } = {};

      if (validatedData.shiftDate !== undefined)
        updateData.shiftDate = validatedData.shiftDate;
      if (validatedData.shiftTime !== undefined)
        updateData.shiftTime = validatedData.shiftTime;
      if (validatedData.upcomingShiftDate !== undefined)
        updateData.upcomingShiftDate = validatedData.upcomingShiftDate;
      if (validatedData.upcomingShiftTime !== undefined)
        updateData.upcomingShiftTime = validatedData.upcomingShiftTime;
      if (validatedData.employeeLocate !== undefined)
        updateData.employeeLocate = validatedData.employeeLocate;

      // Validasi FK shiftTime & upcomingShiftTime
      for (const [key, settingId] of [
        ["shiftTime", updateData.shiftTime],
        ["upcomingShiftTime", updateData.upcomingShiftTime],
      ] as const) {
        if (settingId === undefined) continue;

        const [setting] = await db
          .select({ id: attendanceSettings.id_settings })
          .from(attendanceSettings)
          .where(eq(attendanceSettings.id_settings, settingId))
          .limit(1);

        if (!setting) {
          return res.status(404).json({
            success: false,
            message: `Pengaturan shift tidak ditemukan (${key})`,
          });
        }
      }

      // Cegah duplikat: unique index di DB = (id_employee, shiftDate),
      // jadi cek cukup berdasarkan tanggal saja
      if (updateData.shiftDate !== undefined) {
        const [duplicateShift] = await db
          .select({ shiftId: shiftSchedule.shiftId })
          .from(shiftSchedule)
          .where(
            and(
              eq(shiftSchedule.id_employee, existingShift.id_employee),
              eq(shiftSchedule.shiftDate, updateData.shiftDate),
              ne(shiftSchedule.shiftId, targetShiftId),
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

      // Ambil data TERBARU (gabungan yang diupdate + yang tidak) lewat join
      const currentSetting = alias(attendanceSettings, "current_setting");
      const upcomingSetting = alias(attendanceSettings, "upcoming_setting");

      const [info] = await db
        .select({
          firstName: employes.firstName,
          telegramChatId: employes.telegramChatId,
          shiftDate: shiftSchedule.shiftDate,
          shiftCategory: currentSetting.category,
          shiftIn: currentSetting.normal_time_in,
          shiftOut: currentSetting.normal_time_out,
          upcomingShiftDate: shiftSchedule.upcomingShiftDate,
          upcomingCategory: upcomingSetting.category,
          upcomingIn: upcomingSetting.normal_time_in,
          upcomingOut: upcomingSetting.normal_time_out,
        })
        .from(shiftSchedule)
        .innerJoin(employes, eq(employes.employeeId, shiftSchedule.id_employee))
        .innerJoin(
          currentSetting,
          eq(currentSetting.id_settings, shiftSchedule.shiftTime),
        )
        .leftJoin(
          upcomingSetting,
          eq(upcomingSetting.id_settings, shiftSchedule.upcomingShiftTime),
        )
        .where(eq(shiftSchedule.shiftId, targetShiftId))
        .limit(1);

      if (!info?.telegramChatId) {
        return res.status(200).json({
          success: true,
          message:
            "Berhasil update jadwal shift, tapi karyawan belum mengaktifkan bot Telegram",
          data: updated,
        });
      }

      const [HR] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, user.userId));

      const upcomingText = info.upcomingShiftDate
        ? [
            `📆 Tanggal: ${info.upcomingShiftDate}`,
            `⏱️ Shift: ${info.upcomingCategory} (${fmtTime(info.upcomingIn)} - ${fmtTime(info.upcomingOut)})`,
          ].join("\n")
        : "Belum ada jadwal shift selanjutnya";

      const message = [
        `<b>Jadwal shift kamu telah diubah oleh : ${HR.email} </b>`,
        "",
        `Haloo ${escapeHtml(info.firstName)} 👋`,
        "",
        "Jadwal shift kamu saat ini:",
        `📆 Tanggal: ${info.shiftDate}`,
        `⏱️ Shift: ${info.shiftCategory} (${fmtTime(info.shiftIn)} - ${fmtTime(info.shiftOut)})`,
        "",
        "Perkiraan pergantian shift yang akan datang:",
        upcomingText,
        "",
        "<b>Jangan sampai terlambat ya, ditunggu kehadirannya 😁</b>",
      ].join("\n");

      // Gagal kirim Telegram tidak boleh bikin request 500, update sudah sukses
      let telegramSent = true;
      try {
        await TelegramService.sendMessage(info.telegramChatId, message);
      } catch (err) {
        telegramSent = false;
        console.error("Gagal kirim notifikasi Telegram:", err);
      }

      return res.status(200).json({
        success: true,
        message: telegramSent
          ? "Berhasil update jadwal shift karyawan"
          : "Berhasil update jadwal shift, tapi notifikasi Telegram gagal terkirim",
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

  exportExcelAttendance = async (req: AuthRequest, res: Response) => {
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

  exportExcelShift = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan melihat jadwal shift karyawan",
        });
      }

      // 1. Ambil data shift beserta relasinya
      const data = await db
        .select({
          shiftId: shiftSchedule.shiftId,
          shiftDate: shiftSchedule.shiftDate,
          employeeId: employes.employeeId,
          firstName: employes.firstName,
          lastName: employes.lastName,
          category: attendanceSettings.category,
          normalTimeIn: attendanceSettings.normal_time_in,
          normalTimeOut: attendanceSettings.normal_time_out,
          upcomingShiftDate: shiftSchedule.upcomingShiftDate,
          employeeLocate: shiftSchedule.employeeLocate,
        })
        .from(shiftSchedule)
        .leftJoin(employes, eq(shiftSchedule.id_employee, employes.employeeId))
        .leftJoin(
          attendanceSettings,
          eq(shiftSchedule.shiftTime, attendanceSettings.id_settings),
        );

      // 2. Buat workbook
      const workbook = new ExcelJS.Workbook();

      // 3. Buat worksheet
      const worksheet = workbook.addWorksheet("Jadwal Shift");

      // 4. Buat kolom
      worksheet.columns = [
        { header: "ID Shift", key: "shiftId", width: 15 },
        { header: "Tanggal Shift", key: "shiftDate", width: 20 },
        { header: "Kode Karyawan", key: "employeeId", width: 20 },
        { header: "Nama Depan", key: "firstName", width: 20 },
        { header: "Nama Belakang", key: "lastName", width: 20 },
        { header: "Kategori Shift", key: "category", width: 20 },
        { header: "Jam Masuk", key: "normalTimeIn", width: 20 },
        { header: "Jam Keluar", key: "normalTimeOut", width: 20 },
        {
          header: "Tanggal Shift Berikutnya",
          key: "upcomingShiftDate",
          width: 25,
        },
        { header: "Lokasi Karyawan", key: "employeeLocate", width: 35 },
      ];

      // 5. Masukkan data
      data.forEach((shift) => {
        worksheet.addRow({
          shiftId: shift.shiftId,
          shiftDate: shift.shiftDate,
          employeeId: shift.employeeId,
          firstName: shift.firstName,
          lastName: shift.lastName ?? "-",
          category: shift.category,
          normalTimeIn: shift.normalTimeIn ?? "-",
          normalTimeOut: shift.normalTimeOut ?? "-",
          upcomingShiftDate: shift.upcomingShiftDate ?? "-",
          employeeLocate: shift.employeeLocate ?? "-",
        });
      });

      // 6. Kirim file ke client
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="data-shift.xlsx"',
      );

      await workbook.xlsx.write(res);

      res.end();
    } catch (error) {
      console.error(error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Gagal melakukan export Excel",
        });
      }
    }
  };

  exportExcelEmployee = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan melihat data karyawan",
        });
      }

      // 1. Ambil data karyawan beserta relasinya
      const data = await db
        .select({
          employeeId: employes.employeeId,
          firstName: employes.firstName,
          lastName: employes.lastName,
          email: usersTable.email,
          gender: employes.gender,
          noTelp: employes.noTelp,
          noRek: employes.noRek,
          nip: employes.nip,
          hireDate: employes.hire_date,
          resignDate: employes.resign_date,
          employmentStatus: employes.employment_status,
          city: cities.kota,
          province: provinces.provinsi,
          position: position.position_name,
          department: department.department_name,
        })
        .from(employes)
        .leftJoin(usersTable, eq(employes.userId, usersTable.id))
        .leftJoin(cities, eq(employes.cities_id, cities.id))
        .leftJoin(provinces, eq(cities.provinsi_id, provinces.id))
        .leftJoin(position, eq(employes.idPosition, position.id_position))
        .leftJoin(
          department,
          eq(employes.idDepartment, department.id_department),
        );

      // 2. Buat workbook
      const workbook = new ExcelJS.Workbook();

      // 3. Buat worksheet
      const worksheet = workbook.addWorksheet("Data Karyawan");

      // 4. Buat kolom
      worksheet.columns = [
        { header: "Kode Karyawan", key: "employeeId", width: 20 },
        { header: "Nama Depan", key: "firstName", width: 20 },
        { header: "Nama Belakang", key: "lastName", width: 20 },
        { header: "Email", key: "email", width: 30 },
        { header: "Jenis Kelamin", key: "gender", width: 15 },
        { header: "No Telepon", key: "noTelp", width: 20 },
        { header: "No Rekening", key: "noRek", width: 20 },
        { header: "NIP", key: "nip", width: 20 },
        { header: "Tanggal Masuk", key: "hireDate", width: 20 },
        { header: "Tanggal Resign", key: "resignDate", width: 20 },
        { header: "Status", key: "employmentStatus", width: 15 },
        { header: "Kota", key: "city", width: 20 },
        { header: "Provinsi", key: "province", width: 20 },
        { header: "Jabatan", key: "position", width: 25 },
        { header: "Departemen", key: "department", width: 25 },
      ];

      // 5. Masukkan data
      data.forEach((employee) => {
        worksheet.addRow({
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName ?? "-",
          email: employee.email,
          gender: employee.gender,
          noTelp: employee.noTelp ?? "-",
          noRek: employee.noRek,
          nip: employee.nip,
          hireDate: employee.hireDate,
          resignDate: employee.resignDate ?? "-",
          employmentStatus: employee.employmentStatus,
          city: employee.city,
          province: employee.province,
          position: employee.position,
          department: employee.department,
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

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Gagal melakukan export Excel",
        });
      }
    }
  };

  HRresponsePermission = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      const userRequest = req.body;
      const { status, id_permission } = userRequest;

      const insertPermission = await db
        .update(employeePermission)
        .set({
          status: status,
          approved_by: user.userId,
        })
        .where(eq(employeePermission.id_permission, id_permission));

      const [data] = await db
        .select()
        .from(employeePermission)
        .where(eq(employeePermission.id_permission, id_permission));

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Data permission tidak ditemukan",
        });
      }

      const employee = data.id_employee;

      const [employeeAccount] = await db
        .select()
        .from(employes)
        .where(eq(employes.employeeId, employee));

      if (!employeeAccount) {
        return res.status(404).json({
          success: true,
          message: "employee tidak ditemukan",
        });
      }

      const [HR] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, user.userId));

      if (employeeAccount.telegramChatId) {
        const message = [
          "<b>Balasan izin kamu</b>",
          "",
          `Haloo ${escapeHtml(employeeAccount.firstName)} 👋`,
          "",
          "",
          "HR telah meresponse permintaan kamu,",
          `Keputusan HR : ${status} `,
          "",
          `Disetujui/ditolak oleh : ${HR.email}`,
        ].join("\n");

        await TelegramService.sendMessage(
          employeeAccount.telegramChatId,
          message,
        );
      }

      return res.status(201).json({
        success: true,
        message: "berhasil menanggapi permintaan karyawan",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.flatten().fieldErrors,
        });
      }

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  HRresponseOvertime = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      const userRequest = req.body;
      const { status, id_overtime } = userRequest;

      const [insertOvertime] = await db
        .update(overtime)
        .set({
          status: status,
          approved_by: user.userId,
        })
        .where(eq(overtime.id_overwork, id_overtime))
        .returning();

      const [data] = await db
        .select()
        .from(employes)
        .where(eq(employes.employeeId, insertOvertime.id_employee));

      if (data.telegramChatId) {
        const message = [
          "<b>permintaan lembur</b>",
          "",
          `Haloo ${escapeHtml(data.firstName)} 👋`,
          "",
          "",
          "HR telah meresponse permintaan lembur kamu,",
          `Keputusan HR : ${status} `,
          "",
        ].join("\n");

        await TelegramService.sendMessage(data.telegramChatId, message);
      }

      return res.status(201).json({
        success: true,
        message: "berhasil menanggapi permintaan karyawan",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.flatten().fieldErrors,
        });
      }

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  addComponent = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      const validation = payrollComponentsSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const data = validation.data;

      const inserData = await db
        .insert(payrollComponents)
        .values(data)
        .returning();
      if (inserData.length === 0) {
        return res.status(400).json({
          success: false,
          message: "gagal menambahkan component",
        });
      }

      return res.status(200).json({
        success: true,
        message: "berhasil menambahkan component",
      });
    } catch (error) {
   
      return res.status(500).json({
        success: false,
        message: "internal server error",
      });
    }
  };

  updateComponent = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      const validation = updatePayrollComponentsSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const data = validation.data;

      const updateData = await db
        .update(payrollComponents)
        .set(data)
        .where(eq(payrollComponents.id, Number(req.params.id)))
        .returning();

      if (updateData.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Component tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Berhasil memperbarui component",
        data: updateData[0],
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "internal server error",
      });
    }
  };

  getAllPayrollComponents = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      const components = await db
        .select()
        .from(payrollComponents)
        .orderBy(asc(payrollComponents.id));

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil seluruh data komponen payroll",
        data: components,
      });
    } catch (error) {
      console.error("Error in getAllPayrollComponents:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  payrollAlocation = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      const validation = payrollAllocationsSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const data = validation.data;
      const [allocationData] = await db
        .insert(employeePayrollAllocations)
        .values({
          ...data,
          amount: data.amount.toString(),
        })
        .onConflictDoUpdate({
          target: [
            employeePayrollAllocations.employeeId,
            employeePayrollAllocations.componentId,
          ],
          set: {
            amount: data.amount.toString(),
          },
        })
        .returning();

      return res.status(200).json({
        success: true,
        message: "Alokasi payroll berhasil ditambahkan atau diperbarui",
        data: allocationData,
      });
    } catch (error) {
      console.error("Error in getAllPayrollComponents:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  getAllPayrollAllocations = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      const allocationData = await db
        .select({
          allocationId: employeePayrollAllocations.allocationId,
          employeeId: employeePayrollAllocations.employeeId,
          employeeName: employes.firstName,
          componentId: employeePayrollAllocations.componentId,
          componentName: payrollComponents.componentName,
          type: payrollComponents.type,
          amount: employeePayrollAllocations.amount,
        })
        .from(employeePayrollAllocations)
        .leftJoin(
          employes,
          eq(employeePayrollAllocations.employeeId, employes.employeeId),
        )
        .leftJoin(
          payrollComponents,
          eq(employeePayrollAllocations.componentId, payrollComponents.id),
        );

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil data allocation payroll",
        total: allocationData.length,
        data: allocationData,
      });
    } catch (error) {
      console.error("Error in getAllPayrollAllocations:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  getPayrollAllocationByEmployee = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan untuk akses fitur ini",
        });
      }

      const employeeId = String(req.params.employeeId);

      if (!employeeId || employeeId.length > 30) {
        return res.status(400).json({
          success: false,
          message: "Employee ID tidak valid",
        });
      }

      const allocationData = await db
        .select({
          allocationId: employeePayrollAllocations.allocationId,
          employeeId: employeePayrollAllocations.employeeId,
          componentId: employeePayrollAllocations.componentId,
          componentName: payrollComponents.componentName,
          type: payrollComponents.type,
          amount: employeePayrollAllocations.amount,
        })
        .from(employeePayrollAllocations)
        .leftJoin(
          payrollComponents,
          eq(employeePayrollAllocations.componentId, payrollComponents.id),
        )
        .where(eq(employeePayrollAllocations.employeeId, employeeId));

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil allocation karyawan",
        total: allocationData.length,
        data: allocationData,
      });
    } catch (error) {
      console.error("Error in getPayrollAllocationByEmployee:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  generateAttendanceStatistics = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId || req.user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Akses hanya untuk HR",
        });
      }

      const month = Number(req.body.month);
      const year = Number(req.body.year);

      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(year) ||
        year < 2000
      ) {
        return res.status(400).json({
          success: false,
          message: "Bulan atau tahun tidak valid",
        });
      }

      const { startDate, endDate, effectiveEndDate } = getPeriod(month, year);

      if (startDate > formatDate(new Date())) {
        return res.status(400).json({
          success: false,
          message: "Tidak bisa generate statistik untuk periode mendatang",
        });
      }

      // 1. Ambil seluruh karyawan aktif.
      const employees = await db
        .select({
          employeeId: employes.employeeId,
        })
        .from(employes)
        .where(eq(employes.employment_status, "active"));

      if (employees.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Tidak ada karyawan aktif",
          data: [],
        });
      }

      // 2. Ambil jadwal shift periode tersebut.
      const schedules = await db
        .select({
          employeeId: shiftSchedule.id_employee,
          shiftDate: shiftSchedule.shiftDate,
        })
        .from(shiftSchedule)
        .where(
          and(
            gte(shiftSchedule.shiftDate, startDate),
            lte(shiftSchedule.shiftDate, effectiveEndDate),
          ),
        );

      // 3. Ambil seluruh attendance.
      const attendances = await db
        .select({
          employeeId: employeeAttendance.id_employee,
          shiftDate: employeeAttendance.shiftDate,
          status: employeeAttendance.status,
        })
        .from(employeeAttendance)
        .where(
          and(
            gte(employeeAttendance.shiftDate, startDate),
            lte(employeeAttendance.shiftDate, effectiveEndDate),
          ),
        );

      // 4. Ambil izin yang sudah diterima.
      const permissions = await db
        .select({
          employeeId: employeePermission.id_employee,
          startDate: employeePermission.start_date,
          endDate: employeePermission.end_date,
        })
        .from(employeePermission)
        .where(
          and(
            eq(employeePermission.status, "accepted"),
            lte(employeePermission.start_date, effectiveEndDate),
            gte(employeePermission.end_date, startDate),
          ),
        );

      // 5. Ambil pengajuan lembur yang sudah diterima.
      const periodStart = new Date(`${startDate}T00:00:00`);
      const periodEndExclusive = new Date(
        `${formatDate(
          new Date(
            new Date(`${effectiveEndDate}T00:00:00`).getTime() +
              24 * 60 * 60 * 1000,
          ),
        )}T00:00:00`,
      );

      const overtimes = await db
        .select({
          employeeId: overtime.id_employee,
          overtimeTotal: overtime.overtimeTotal,
        })
        .from(overtime)
        .where(
          and(
            eq(overtime.status, "accepted"),
            gte(overtime.overtimeDate, periodStart),
            lt(overtime.overtimeDate, periodEndExclusive),
          ),
        );

      // 6. Siapkan map agar perhitungan lebih efisien.
      const scheduleMap = new Map<string, Set<string>>();
      const attendanceMap = new Map<string, Map<string, string | null>>();

      const permissionMap = new Map<
        string,
        Array<{ startDate: string; endDate: string }>
      >();

      const overtimeMap = new Map<string, number>();

      // Jadwal kerja.
      for (const item of schedules) {
        if (!scheduleMap.has(item.employeeId)) {
          scheduleMap.set(item.employeeId, new Set());
        }

        scheduleMap.get(item.employeeId)!.add(item.shiftDate);
      }

      // Attendance.
      for (const item of attendances) {
        if (!attendanceMap.has(item.employeeId)) {
          attendanceMap.set(item.employeeId, new Map());
        }

        const employeeAttendanceMap = attendanceMap.get(item.employeeId)!;

        // Satu tanggal hanya dihitung satu kali.
        const previousStatus = employeeAttendanceMap.get(item.shiftDate);

        if (previousStatus === undefined || item.status === "late") {
          employeeAttendanceMap.set(item.shiftDate, item.status);
        }
      }

      // Permission.
      for (const item of permissions) {
        if (!permissionMap.has(item.employeeId)) {
          permissionMap.set(item.employeeId, []);
        }

        permissionMap.get(item.employeeId)!.push({
          startDate: item.startDate,
          endDate: item.endDate,
        });
      }

      // Overtime.
      for (const item of overtimes) {
        const previous = overtimeMap.get(item.employeeId) ?? 0;

        overtimeMap.set(item.employeeId, previous + item.overtimeTotal);
      }

      // 7. Hitung statistik setiap karyawan.
      const statistics = employees.map((employee) => {
        const employeeId = employee.employeeId;

        const employeeSchedules =
          scheduleMap.get(employeeId) ?? new Set<string>();

        const employeeAttendances = attendanceMap.get(employeeId) ?? new Map();

        const employeePermissions = permissionMap.get(employeeId) ?? [];

        const presentDates = new Set<string>();
        const permissionDates = new Set<string>();
        const lateDates = new Set<string>();

        // Hitung kehadiran dan keterlambatan.
        for (const [date, status] of employeeAttendances) {
          if (employeeSchedules.has(date)) {
            presentDates.add(date);

            if (status === "late") {
              lateDates.add(date);
            }
          }
        }

        // Izin hanya dihitung pada tanggal yang memiliki jadwal.
        for (const date of employeeSchedules) {
          const hasPermission = employeePermissions.some(
            (permission) =>
              date >= permission.startDate && date <= permission.endDate,
          );

          // Jika hadir, tanggal tersebut tidak dihitung sebagai izin.
          if (hasPermission && !presentDates.has(date)) {
            permissionDates.add(date);
          }
        }

        const totalEffectiveDays = employeeSchedules.size;

        const totalPresent = presentDates.size;

        const totalPermission = permissionDates.size;

        const totalAlpha = Math.max(
          0,
          totalEffectiveDays - totalPresent - totalPermission,
        );

        const totalLate = lateDates.size;

        const totalOvertime = overtimeMap.get(employeeId) ?? 0;

        return {
          employeeId,
          month,
          year,
          totalEffectiveDays,
          totalPresent,
          totalAlpha,
          totalPermission,
          totalOvertime,
          totalLate,
        };
      });

      // 8. Simpan menggunakan UPSERT.
      // 8. Simpan seluruh statistik menggunakan batch UPSERT.
      if (statistics.length > 0) {
        await db
          .insert(employeeAttendanceStatistics)
          .values(statistics)
          .onConflictDoUpdate({
            target: [
              employeeAttendanceStatistics.employeeId,
              employeeAttendanceStatistics.month,
              employeeAttendanceStatistics.year,
            ],
            set: {
              totalEffectiveDays: sql`excluded.total_effective_days`,
              totalPresent: sql`excluded.total_present`,
              totalAlpha: sql`excluded.total_alpha`,
              totalPermission: sql`excluded.total_permission`,
              totalOvertime: sql`excluded.total_overtime`,
              totalLate: sql`excluded.total_late`,
              updatedAt: new Date(),
            },
          });
      }

      return res.status(200).json({
        success: true,
        message: "Statistik kehadiran berhasil digenerate",
        period: {
          month,
          year,
          startDate,
          endDate: effectiveEndDate,
          defaultEffectiveDays: DEFAULT_EFFECTIVE_DAYS,
        },
        totalEmployees: statistics.length,
        data: statistics,
      });
    } catch (error) {
      console.error("Generate Attendance Statistics Error:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat menghitung statistik kehadiran",
      });
    }
  };

  // GET seluruh statistik.
  getAttendanceStatistics = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId || req.user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Akses hanya untuk HR",
        });
      }

      const month = Number(req.query.month);
      const year = Number(req.query.year);

      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(year) ||
        year < 2000
      ) {
        return res.status(400).json({
          success: false,
          message: "Bulan atau tahun tidak valid",
        });
      }

      const data = await db
        .select({
          id: employeeAttendanceStatistics.id,
          employeeId: employeeAttendanceStatistics.employeeId,
          firstName: employes.firstName,
          lastName: employes.lastName,
          month: employeeAttendanceStatistics.month,
          year: employeeAttendanceStatistics.year,
          totalEffectiveDays: employeeAttendanceStatistics.totalEffectiveDays,
          totalPresent: employeeAttendanceStatistics.totalPresent,
          totalAlpha: employeeAttendanceStatistics.totalAlpha,
          totalPermission: employeeAttendanceStatistics.totalPermission,
          totalOvertime: employeeAttendanceStatistics.totalOvertime,
          totalLate: employeeAttendanceStatistics.totalLate,
        })
        .from(employeeAttendanceStatistics)
        .innerJoin(
          employes,
          eq(employeeAttendanceStatistics.employeeId, employes.employeeId),
        )
        .where(
          and(
            eq(employeeAttendanceStatistics.month, month),
            eq(employeeAttendanceStatistics.year, year),
          ),
        );

      return res.status(200).json({
        success: true,
        message: "Statistik kehadiran berhasil diambil",
        total: data.length,
        data,
      });
    } catch (error) {
      console.error("Get Attendance Statistics Error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil statistik kehadiran",
      });
    }
  };

  // GET statistik berdasarkan employee ID.
  getEmployeeAttendanceStatistics = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.userId || req.user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Akses hanya untuk HR",
        });
      }

      const employeeId = String(req.params);

      const month = Number(req.query.month);
      const year = Number(req.query.year);

      if (
        !employeeId ||
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(year) ||
        year < 2000
      ) {
        return res.status(400).json({
          success: false,
          message: "Parameter employeeId, month, atau year tidak valid",
        });
      }

      const [data] = await db
        .select({
          id: employeeAttendanceStatistics.id,
          employeeId: employeeAttendanceStatistics.employeeId,
          firstName: employes.firstName,
          lastName: employes.lastName,
          month: employeeAttendanceStatistics.month,
          year: employeeAttendanceStatistics.year,
          totalEffectiveDays: employeeAttendanceStatistics.totalEffectiveDays,
          totalPresent: employeeAttendanceStatistics.totalPresent,
          totalAlpha: employeeAttendanceStatistics.totalAlpha,
          totalPermission: employeeAttendanceStatistics.totalPermission,
          totalOvertime: employeeAttendanceStatistics.totalOvertime,
          totalLate: employeeAttendanceStatistics.totalLate,
        })
        .from(employeeAttendanceStatistics)
        .innerJoin(
          employes,
          eq(employeeAttendanceStatistics.employeeId, employes.employeeId),
        )
        .where(
          and(
            eq(employeeAttendanceStatistics.employeeId, employeeId),
            eq(employeeAttendanceStatistics.month, month),
            eq(employeeAttendanceStatistics.year, year),
          ),
        )
        .limit(1);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Statistik karyawan tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Statistik karyawan berhasil diambil",
        data,
      });
    } catch (error) {
      console.error("Get Employee Attendance Statistics Error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil statistik karyawan",
      });
    }
  };

  HROvertime = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(401).json({
          success: false,
          message: "tidak di izinkan mengakses endpoint ini",
        });
      }

      const validation = overtimeHRSchema.parse(req.body);

      const { id_employee, overtimeDate, overtimeTotal, description } =
        validation;

      const [insertOvertime] = await db
        .insert(overtime)
        .values({
          id_employee: id_employee,
          overtimeDate: new Date(overtimeDate),
          overtimeTotal: overtimeTotal,
          description: description,
          approved_by: user.userId,
          status: "accepted",
        })
        .returning();

      const [employee] = await db
        .select()
        .from(employes)
        .where(eq(employes.employeeId, id_employee));
      const [HR] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, user.userId));
      if (employee.telegramChatId) {
        const message = [
          "<b>Pesan dari Kerjaku</b>",
          "",
          `Haloo ${escapeHtml(employee.firstName)} 👋`,
          "",
          "Kamu mendapat jadwal lembur dari HR nih:",
          `📆 Tanggal & waktu: ${insertOvertime.overtimeDate}`,
          `⏱️ waktu lembur: ${insertOvertime.overtimeTotal} JAM`,
          "",
          "Lembur diberikan oleh:",
          `${HR.email}`,
          "",
          "<b>Semangat yaa... 😁</b>",
        ].join("\n");

        await TelegramService.sendMessage(employee.telegramChatId, message);
      }

      return res.status(201).json({
        success: true,
        message: "Pengajuan lembur berhasil dibuat",
        data: insertOvertime,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: error.flatten().fieldErrors,
        });
      }

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  };

  getShiftSettings = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan mengakses pengaturan shift",
        });
      }

      const data = await db
        .select({
          id_settings: attendanceSettings.id_settings,
          category: attendanceSettings.category,
          normal_time_in: attendanceSettings.normal_time_in,
          normal_time_out: attendanceSettings.normal_time_out,
          tolerance_time: attendanceSettings.tolerance_time,
        })
        .from(attendanceSettings)
        .orderBy(asc(attendanceSettings.id_settings));

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil pengaturan shift",
        total: data.length,
        data,
      });
    } catch (error) {
      console.error("Get Shift Settings Error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil pengaturan shift",
      });
    }
  };

  createShiftSettings = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user?.userId) {
        return res.status(401).json({
          success: false,
          message: "Sesi tidak valid",
        });
      }

      if (user.role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Anda tidak diizinkan menambahkan pengaturan shift",
        });
      }

      const validation = shiftSettingsSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validasi gagal",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      const [created] = await db
        .insert(attendanceSettings)
        .values(validation.data)
        .returning();

      return res.status(201).json({
        success: true,
        message: "Berhasil menambahkan pengaturan shift",
        data: created,
      });
    } catch (error) {
      console.error("Create Shift Settings Error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal menambahkan pengaturan shift",
      });
    }
  };
}
export default new HRfeatures();
