import { Request, Response } from "express";
import { GeminiService } from "../../services/gemini.service";

const geminiService = new GeminiService();

export class GeminiController {
  testGemini = async (req: Request, res: Response) => {
    try {
      console.log("1. Controller dipanggil");

      const result = await geminiService.analyzeData({
        name: "budi",
      });

      console.log("3. Hasil diterima");

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Gemini Error:", error);

      console.error("Gemini Error:", error);

      if (error.status === 503) {
        return res.status(503).json({
          success: false,
          message: "AI sedang sibuk. Silakan coba beberapa saat lagi.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Gagal melakukan analisis AI",
      });
    }
  };
}

export default new GeminiController();
