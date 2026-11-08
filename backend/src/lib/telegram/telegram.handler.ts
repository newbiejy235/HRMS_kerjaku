import { bot } from "../../config/telegramBot";
import { db } from "../../config/db";
import { employes } from "../../config/schema";
import { eq, and, gt } from "drizzle-orm";

bot.onText(/^\/start(?:\s+(.+))?$/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const pairingToken = match?.[1];
    const telegramUserId = msg.from?.id;

    if (msg.chat.type !== "private") {
      return;
    }

    if (!pairingToken || !telegramUserId) {
      await bot.sendMessage(
        chatId,
        "Silakan gunakan link pairing dari aplikasi KerjaKu."
      );
      return;
    }

    // Cari akun berdasarkan pairing token
    const [employee] = await db
      .select({
        userId: employes.userId,
      })
      .from(employes)
      .where(
        and(
          eq(employes.telegramPairingToken, pairingToken),
          gt(employes.telegramPairingExpiresAt, new Date())
        )
      )
      .limit(1);

    if (!employee) {
      await bot.sendMessage(
        chatId,
        "Link pairing tidak valid atau sudah kedaluwarsa. Silakan buat link baru melalui KerjaKu."
      );
      return;
    }

    // Simpan Chat ID Telegram langsung ke database
    await db
      .update(employes)
      .set({
        telegramChatId: String(chatId),
        telegramPairingToken: null,
        telegramPairingExpiresAt: null,
      })
      .where(eq(employes.userId, employee.userId));

    await bot.sendMessage(
      chatId,
      `Halo! Akun Telegram berhasil dihubungkan dengan KerjaKu.\n\nTelegram User ID: ${telegramUserId}\nStatus: Terhubung`
    );

  } catch (error) {
    console.error("Telegram pairing error:", error);

    await bot.sendMessage(
      msg.chat.id,
      "Terjadi kesalahan saat menghubungkan akun. Silakan coba lagi."
    );
  }
});