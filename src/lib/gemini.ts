import { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiModel = (customKey?: string) => {
  const apiKey = customKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please provide one in .env.local or settings.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
  });
};

// Legacy export for compatibility
export const model = getGeminiModel();