import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem } from "../types";

// Using gemini-3-flash-preview as it is multimodal and highly capable of analyzing images + JSON schema output
const MODEL_NAME = "gemini-3-flash-preview";

const FOOD_ITEM_SCHEMA = {
  type: Type.ARRAY,
  description: "List of identified food items with nutritional info",
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Name of the food item" },
      calories: { type: Type.NUMBER, description: "Estimated calories" },
      protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
      carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
      fat: { type: Type.NUMBER, description: "Estimated fat in grams" },
    },
    required: ["name", "calories", "protein", "carbs", "fat"],
  },
} as const;

const roundFoodItems = (items: FoodItem[]): FoodItem[] =>
  items.map(item => ({
    ...item,
    calories: Math.round(item.calories),
    protein: Math.round(item.protein),
    carbs: Math.round(item.carbs),
    fat: Math.round(item.fat),
  }));

/** Classify error into a user-friendly message */
const getErrorMessage = (error: unknown): string => {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes('api key') || lower.includes('api_key') || lower.includes('unauthorized') || lower.includes('403')) {
    return 'Invalid or missing API key. Please check your configuration.';
  }
  if (lower.includes('429') || lower.includes('rate') || lower.includes('quota') || lower.includes('resource_exhausted')) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }
  if (lower.includes('too large') || lower.includes('payload') || lower.includes('413') || lower.includes('request entity')) {
    return 'Image is too large. Try taking a photo from further away or use text description instead.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout') || lower.includes('failed to fetch') || lower.includes('econnrefused')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (lower.includes('500') || lower.includes('503') || lower.includes('internal') || lower.includes('unavailable')) {
    return 'AI service is temporarily unavailable. Please try again in a moment.';
  }
  return `Analysis failed: ${msg.slice(0, 100)}`;
};

/** Check if an error is retryable (transient) */
const isRetryable = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return lower.includes('429') || lower.includes('rate') || lower.includes('quota') ||
         lower.includes('500') || lower.includes('503') || lower.includes('unavailable') ||
         lower.includes('internal') || lower.includes('resource_exhausted') ||
         lower.includes('network') || lower.includes('fetch') || lower.includes('timeout') ||
         lower.includes('failed to fetch') || lower.includes('econnrefused');
};

const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 2000]; // ms

/** Sleep helper */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Execute a function with retry logic for transient errors */
const withRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`, error);
      if (attempt < MAX_RETRIES && isRetryable(error)) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      break;
    }
  }
  // Throw with user-friendly message
  const friendlyMsg = getErrorMessage(lastError);
  const enrichedError = new Error(friendlyMsg);
  (enrichedError as any).originalError = lastError;
  throw enrichedError;
};

export const analyzeFoodImage = async (base64Image: string): Promise<FoodItem[]> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this image. If the image does not contain any food or drinks, return an empty array []. Otherwise, identify the distinct food items present. For each item, estimate the calories, protein (g), carbs (g), and fat (g). Be realistic with portion sizes based on visual cues.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: FOOD_ITEM_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return [];

    return roundFoodItems(JSON.parse(text) as FoodItem[]);
  });
};

export const analyzeFoodDescription = async (description: string): Promise<FoodItem[]> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: `A user described their meal as follows: "${description}". Based on this description, identify the distinct food items. For each item, estimate the calories, protein (g), carbs (g), and fat (g). Be realistic with portion sizes based on the description (e.g. quantities, sizes mentioned). If a quantity is specified (like "12 dumplings"), calculate the total nutrition for that quantity.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: FOOD_ITEM_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return [];

    return roundFoodItems(JSON.parse(text) as FoodItem[]);
  });
};
