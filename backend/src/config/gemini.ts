import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_APIKEY,
});

console.log("API KEY tersedia:", Boolean(process.env.GEMINI_APIKEY));
