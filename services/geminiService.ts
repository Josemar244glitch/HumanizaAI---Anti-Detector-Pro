
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT, MODE_MAPPING, DETECTION_PROMPT, SEARCH_PROMPT } from "../constants";
import { AppMode, GroundingSource } from "../types";

// A chave de API foi permanentemente integrada para configuração automática.
const GEMINI_API_KEY = "AIzaSyB2kdRGw81vM73nqJ7l_koisa9kE2UqEME";

export interface AIDetectionResult {
  score: number;
  label: string;
  reasoning: string;
}

export interface ServiceResult {
    text: string;
    sources: GroundingSource[];
}

const getAiClient = (): GoogleGenAI => {
    if (!GEMINI_API_KEY) {
        throw new Error("A chave de API do Google Gemini não foi configurada no código-fonte.");
    }
    return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
};

export const humanizeText = async (text: string, mode: AppMode): Promise<ServiceResult> => {
  const ai = getAiClient();
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
      tools: [{googleSearch: {}}],
    });

    const humanizedText = response.text?.trim() || "Ocorreu um erro ao gerar o texto.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text: humanizedText, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha na comunicação com o cérebro da IA.");
  }
};

export const searchWithGoogle = async (query: string): Promise<ServiceResult> => {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: query,
      config: {
        systemInstruction: SEARCH_PROMPT,
      },
      tools: [{googleSearch: {}}],
    });

    const summaryText = response.text?.trim() || "Não foi possível gerar um resumo.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text: summaryText, sources };
  } catch (error) {
    console.error("Google Search Error:", error);
    throw new Error("Falha ao realizar a pesquisa no Google.");
  }
};


export const detectAI = async (text: string): Promise<AIDetectionResult> => {
  const ai = getAiClient();

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
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
