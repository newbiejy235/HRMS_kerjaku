import { Response } from "express";
import { AuthRequest } from "../../middleware/users.middleware";

import { db } from "../../config/db";
import {
  employeeReimbursements,
  employes,
  usersTable,
} from "../../config/schema";

import { eq, desc, and, ne, isNotNull } from "drizzle-orm";

import cloudinary from "../../lib/cloudinary";
import { uploadReimbursePhoto } from "../../lib/uploadReimburse";
import TelegramService from "../../services/notification.service";

export class ReimbursementController {
  // POST: Create Reimbursement
  createReimbursement = async (req: AuthRequest, res: Response) => {
    let uploadedPublicId: string | undefined;

    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { name, description, amount, expenseDate } = req.body;

      // Validasi input
      if (!name || !amount || !expenseDate) {
        return res.status(400).json({
          success: false,
          message: "Nama, nominal, dan tanggal pengeluaran wajib diisi",
        });
      }

      if (Number(amount) <= 0 || !Number.isFinite(Number(amount))) {
        return res.status(400).json({
          success: false,
          message: "Nominal reimburse harus lebih dari 0",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Foto bukti reimburse wajib diunggah",
        });
      }

      // Upload foto ke Cloudinary
      const uploadedPhoto = await uploadReimbursePhoto(req.file.buffer);

      uploadedPublicId = uploadedPhoto.public_id;

      const [user] = await db
        .select()
        .from(employes)
        .where(eq(employes.userId, userId));

      // Insert database
      const [reimbursement] = await db
        .insert(employeeReimbursements)
        .values({
          employeeId: user.employeeId,
          name,
          description: description || null,
          amount: String(amount),
          expenseDate,
          receiptPhoto: uploadedPhoto.secure_url,
          status: "pending",
        })
        .returning();

      const escapeHtml = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const hrList = await db
        .select({
          telegramChatId: employes.telegramChatId,
          firstName: employes.firstName,
        })
        .from(employes)
        .innerJoin(usersTable, eq(usersTable.id, employes.userId))
        .where(
          and(
            eq(usersTable.role, "HR"),
            isNotNull(employes.telegramChatId),
            ne(employes.telegramChatId, ""),
          ),
        );

      for (const hr of hrList) {
        if (!hr.telegramChatId) continue;

        const message = [
          "<b>Pesan dari Kerjaku</b>",
          "",
          `Haloo ${escapeHtml(hr.firstName)} 👋`,
          "",
          "Kamu mendapat notifikasi pengajuan reimburse dari karyawan nih:",
          `📆 Tanggal: ${expenseDate}`,
          "",
          "Pengajuan dibuat oleh:",
          `${reimbursement.employeeId}`,
          "",
          "<b>Segera tanggapi pengajuan dari karyawan</b>",
        ].join("\n");

        await TelegramService.sendMessage(hr.telegramChatId, message);
      }

      return res.status(201).json({
        success: true,
        message: "Pengajuan reimburse berhasil dibuat",
        data: reimbursement,
      });
    } catch (error) {
      // Hapus foto jika insert database gagal
      if (uploadedPublicId) {
        await cloudinary.uploader
          .destroy(uploadedPublicId)
          .catch(console.error);
      }

      console.error("Create reimbursement error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal membuat pengajuan reimburse",
      });
    }
  };

  // GET: Get My Reimbursements
  getReimbursements = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const [user] = await db
        .select()
        .from(employes)
        .where(eq(employes.userId, userId));

      const reimbursements = await db
        .select()
        .from(employeeReimbursements)
        .where(eq(employeeReimbursements.employeeId, user.employeeId))
        .orderBy(desc(employeeReimbursements.createdAt));

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil data reimburse",
        total: reimbursements.length,
        data: reimbursements,
      });
    } catch (error) {
      console.error("Get reimbursement error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data reimburse",
      });
    }
  };

  // PATCH: HR Approve / Reject Reimbursement
  reviewReimbursement = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;

      // Validasi login
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Validasi role HR
      if (role !== "HR") {
        return res.status(403).json({
          success: false,
          message: "Hanya HR yang dapat melakukan review reimburse",
        });
      }

      const reimbursementId = Number(req.params.id);

      if (!Number.isInteger(reimbursementId) || reimbursementId <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID reimburse tidak valid",
        });
      }

      const { status, rejectionReason } = req.body;

      // Validasi status
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status hanya boleh approved atau rejected",
        });
      }

      // Validasi alasan penolakan
      if (
        status === "rejected" &&
        (!rejectionReason || !rejectionReason.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Alasan penolakan wajib diisi",
        });
      }

      // Update hanya jika status masih pending
      const [updatedReimbursement] = await db
        .update(employeeReimbursements)
        .set({
          status,
          reviewBy: userId,
          reviewedAt: new Date(),
          rejectionReason:
            status === "rejected" ? rejectionReason.trim() : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(employeeReimbursements.id, reimbursementId),
            eq(employeeReimbursements.status, "pending"),
          ),
        )
        .returning();

      if (!updatedReimbursement) {
        const [existingReimbursement] = await db
          .select({
            id: employeeReimbursements.id,
            status: employeeReimbursements.status,
          })
          .from(employeeReimbursements)
          .where(eq(employeeReimbursements.id, reimbursementId))
          .limit(1);

        if (!existingReimbursement) {
          return res.status(404).json({
            success: false,
            message: "Data reimburse tidak ditemukan",
          });
        }

        return res.status(409).json({
          success: false,
          message: `Reimburse sudah direview dengan status ${existingReimbursement.status}`,
        });
      }

      const [employee] = await db
        .select()
        .from(employes)
        .where(eq(employes.employeeId, updatedReimbursement.employeeId))
        .limit(1);

      const [HR] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      const escapeHtml = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      if (employee.telegramChatId) {
        const message = [
          "<b>Pesan tanggapan reimbursement dari Kerjaku</b>",
          "",
          `Haloo ${escapeHtml(employee.firstName)} 👋`,
          "",
          "pengajuan reimbursement telah:",
          `📝 Status: ${updatedReimbursement.status}`,
          "",
          "Disetujui/ditolak oleh:",
          `${HR.email}`,
          "",
          "<b>...............</b>",
        ].join("\n");

        await TelegramService.sendMessage(employee.telegramChatId, message);
      }

      return res.status(200).json({
        success: true,
        message:
          status === "approved"
            ? "Reimburse berhasil disetujui"
            : "Reimburse berhasil ditolak",
        data: updatedReimbursement,
      });
    } catch (error) {
      console.error("Review reimbursement error:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal melakukan review reimburse",
      });
    }
  };
}
