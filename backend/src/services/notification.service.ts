import { bot } from "../config/telegramBot";

export class TelegramService {
  async sendMessage(chatId: string, message: string) {
    try {
      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
      });

      return {
        success: true,
        message: "Pesan berhasil dikirim",
      };
    } catch (error) {
      console.error("Telegram Error:", error);

      return {
        success: false,
        message: "Gagal mengirim pesan Telegram",
      };
    }
  }
}

export default new TelegramService();