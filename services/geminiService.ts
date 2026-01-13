
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT, MODE_MAPPING, DETECTION_PROMPT } from "../constants";
import { HumanizationMode } from "../types";

export interface AIDetectionResult {
  score: number;
  label: string;
  reasoning: string;
}

export const humanizeText = async (text: string, mode: HumanizationMode): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const selectedModeLabel = MODE_MAPPING[mode];
  
  const prompt = `
  HUMANIZE O SEGUINTE TEXTO AGORA.
  MODO: ${selectedModeLabel}
  TEXTO ORIGINAL:
  ---
  ${text}
  ---
  ENTREGA APENAS O TEXTO HUMANIZADO FINAL.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.9,
        topP: 0.95,
      },
    });

    return response.text?.trim() || "Ocorreu um erro ao gerar o texto.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha na comunicação com o cérebro da IA.");
  }
};

export const detectAI = async (text: string): Promise<AIDetectionResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este texto:\n\n${text}`,
      config: {
        systemInstruction: DETECTION_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            label: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
          required: ["score", "label", "reasoning"]
        }
      },
    });

    const data = JSON.parse(response.text || '{}');
    return data as AIDetectionResult;
  } catch (error) {
    console.error("AI Detection Error:", error);
    throw new Error("Não foi possível analisar o texto agora.");
  }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType,
            },
          },
          { text: "Extraia todo o texto visível nesta imagem. Retorne apenas o texto extraído, mantendo a formatação original onde possível." },
        ],
      },
    });

    return response.text?.trim() || "Nenhum texto encontrado na imagem.";
  } catch (error) {
    console.error("Image Extraction Error:", error);
    throw new Error("Não foi possível ler o texto da imagem.");
  }
};
