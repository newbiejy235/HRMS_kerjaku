import { gemini } from "../config/gemini";

export class GeminiService {
  analyzeData = async (data: object) => {
    console.log("Mengirim request ke Gemini...");

    const response = await gemini.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Balas dengan singkat berdasarkan data ini: ${JSON.stringify(data)}`,
    });

    console.log("Gemini berhasil merespons!");

    return response.text;
  };
}
