// activationBot.ts

import { Response } from "express";
import { db } from "../config/db";
import { employes } from "../../src/config/schema";
import { AuthRequest } from "../../src/middleware/users.middleware";
import { getChatId } from "../lib/telegram/telegram.store";
import { eq } from "drizzle-orm";

export const activationBot = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Sesi tidak valid",
      });
    }

    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Body:", req.body);
    console.log("User:", req.user);

    // Ini harus menggunakan ID Telegram yang sudah
    // dikaitkan dengan akun melalui proses verifikasi.

    const telegramUserId = req.body?.telegramUserId;

    if (typeof telegramUserId !== "string" || !telegramUserId.trim()) {
      return res.status(400).json({
        success: false,
        message: "telegramUserId wajib dikirim",
      });
    }

    const chatId = getChatId(telegramUserId);

    if (chatId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Chat ID belum ditemukan. Kirim /start ke bot dahulu.",
      });
    }

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID belum ditemukan. Jalankan /start dahulu.",
      });
    }

    await db
      .update(employes)
      .set({
        telegramChatId: String(chatId),
      })
      .where(eq(employes.userId, userId));

    return res.status(200).json({
      success: true,
      message: "Telegram berhasil diaktifkan",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};
