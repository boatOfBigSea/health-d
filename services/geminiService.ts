
import { GoogleGenAI } from "@google/genai";
import { HealthRecord } from "../types";

export const getSmartAdvice = async (records: HealthRecord[]): Promise<string | null> => {
  if (records.length === 0) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const current = records[0];
    const previous = records.length > 1 ? records[1] : null;

    const prompt = `
      Act as a professional health coach. Based on these body metrics, provide a concise (max 3 sentences) encouraging health advice in Chinese.
      Current Record: Date: ${current.date}, Height: ${current.height}cm, Weight: ${current.weight}kg, BMI: ${current.bmi}.
      ${previous ? `Previous Record: Weight: ${previous.weight}kg, BMI: ${previous.bmi}.` : 'This is the first record.'}
      Focus on trends if applicable. Keep it positive and actionable.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "保持记录，您的健康正在一点点积累！";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return null;
  }
};
