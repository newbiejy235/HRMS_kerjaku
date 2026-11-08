import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN!;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN belum diatur");
}

export const bot = new TelegramBot(token, {
  polling: true,
});