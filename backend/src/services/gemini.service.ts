import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_APIKEY });

export class GeminiService {
  analyzeData = async (data: object) => {
    console.log("Mengirim request ke Gemini...");

    const response = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: `say hello to  ${JSON.stringify(data, null, 2)}`,
    });

    console.log("Gemini berhasil merespons!");

    return console.log(response.output_text);
  };
}
