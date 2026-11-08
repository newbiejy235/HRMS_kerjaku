import { Request, Response } from "express";
import crypto from "crypto";
import { eq } from "drizzle-orm";

import { db } from "../../config/db";
import { employes } from "../../config/schema";
import { AuthRequest } from "../../middleware/users.middleware";
import dotenv from "dotenv";
dotenv.config();

export class TelegramController {
  // Generate URL pairing Telegram
  createTelegramPairing = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Cari employee berdasarkan user login
      const [employee] = await db
        .select({
          employeeId: employes.employeeId,
          telegramChatId: employes.telegramChatId,
        })
        .from(employes)
        .where(eq(employes.userId, userId));

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Data karyawan tidak ditemukan",
        });
      }

      // Cek apakah Telegram sudah terhubung
      if (employee.telegramChatId) {
        return res.status(200).json({
          success: true,
          connected: true,
          message: "Telegram sudah terhubung",
        });
      }

      const botUsername = process.env.TELEGRAM_BOT_NAME;

      if (!botUsername) {
        throw new Error("TELEGRAM_BOT_NAME belum dikonfigurasi");
      }

      // Generate token unik
      const pairingToken = crypto.randomBytes(32).toString("hex");

      // Token berlaku selama 10 menit
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Simpan token ke database
      await db
        .update(employes)
        .set({
          telegramPairingToken: pairingToken,
          telegramPairingExpiresAt: expiresAt,
        })
        .where(eq(employes.employeeId, employee.employeeId));

      // Generate Telegram Deep Link
      const telegramUrl = `https://t.me/${botUsername}?start=${pairingToken}`;

      return res.status(200).json({
        success: true,
        connected: false,
        telegramUrl,
        expiresAt,
        message: "Silakan hubungkan akun Telegram Anda",
      });
    } catch (error) {
      console.error("Create Telegram Pairing:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal membuat pairing Telegram",
      });
    }
  };

  // Mengecek status Telegram
  getTelegramStatus = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const [employee] = await db
        .select({
          telegramChatId: employes.telegramChatId,
        })
        .from(employes)
        .where(eq(employes.userId, userId));

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Data karyawan tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        connected: Boolean(employee.telegramChatId),
        message: employee.telegramChatId
          ? "Telegram sudah terhubung"
          : "Telegram belum terhubung",
      });
    } catch (error) {
      console.error("Get Telegram Status:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengecek status Telegram",
      });
    }
  };
}

export default new TelegramController();
