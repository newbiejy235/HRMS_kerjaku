// src/lib/telegram/telegram.handler.ts

import { bot } from "../../config/telegramBot";
import { saveChatId } from "./telegram.store";

bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;

  // Contoh: identitas Telegram pengirim
  const telegramUserId = String(msg.from?.id);

  saveChatId(telegramUserId, chatId);

  console.log("Telegram Chat ID:", chatId);

  await bot.sendMessage(
    chatId,
    "Bot KerjaKu aktif! Chat ID berhasil diterima.",
  );
});