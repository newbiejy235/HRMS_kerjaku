import { db } from "../../config/db";
import { eq } from "drizzle-orm";
import { passwordResetRequests, usersTable } from "../../config/schema";
import { Request, Response, NextFunction } from "express";
import {
  createVerificationSchema,
  reviewVerificationSchema,
  hrReviewSchema,
} from "../../validation/verification.validation";
import { ZodError, z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
      const [makeRequest] = await db.insert(passwordResetRequests).values({
        userId: userId,
        status: "pending",
      }).returning();

      if (!makeRequest) {
        return res.status(400).json({
          success: false,
          message: "Gagal membuat permintaan reset password",
        });
      }

      // Response generic - tidak mengungkap status request sebelum HR review
      return res.status(200).json({
        success: true,
        message: "Permintaan reset password telah dibuat dengan status pending. Menunggu review HR.",
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
        const token = this.generateToken();
        const tokenHash = await bcrypt.hash(token, 10);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

        // Simpan token hash ke database beserta expiresAt
        await db
          .update(passwordResetRequests)
          .set({
            status: "approved",
            token: tokenHash,
            expiresAt,
            reviewedBy: reviewedBy,
            reviewedAt: new Date(),
          })
          .where(eq(passwordResetRequests.id, requestId));

        return res.status(200).json({
          success: true,
          message: "Request disetujui. Token reset telah dibuat",
        });
      }

      // Jika HR menolak
      return res.status(200).json({
        success: true,
        message: "Request ditolak. Karyawan akan diberitahu permintaan ditolak.",
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
}