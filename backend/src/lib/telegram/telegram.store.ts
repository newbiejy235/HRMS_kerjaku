// src/lib/telegram/telegram.store.ts

const chatIds = new Map<string, number>();

export const saveChatId = (userTelegramId: string, chatId: number) => {
  chatIds.set(userTelegramId, chatId);
};

export const getChatId = (userTelegramId: string) => {
  return chatIds.get(userTelegramId);
};