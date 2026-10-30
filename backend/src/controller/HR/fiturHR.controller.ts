import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { passwordResetRequests, usersTable } from "../../config/schema";
import { Request, Response, NextFunction } from "express";
import {
  createVerificationSchema,
  reviewVerificationSchema,
  hrReviewSchema,
} from "../../validation/verification.validation";
import { manageEmploye } from "../../validation/manageEmployee.validation";
import { ZodError, z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { employes } from "../../config/schema";
import { bot } from "../../config/telegramBot";
import { AuthRequest } from "../../middleware/users.middleware";

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
}

export default new HRfeatures();
