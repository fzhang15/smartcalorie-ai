import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem } from "../types";

// Using gemini-3-flash-preview as it is multimodal and highly capable of analyzing images + JSON schema output
const MODEL_NAME = "gemini-3-flash-preview";

export const analyzeFoodImage = async (base64Image: string): Promise<FoodItem[]> => {
  try {
    // The API key must be obtained exclusively from the environment variable process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Clean base64 string if it contains metadata
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity from camera
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this image of food. Identify the distinct food items present. For each item, estimate the calories, protein (g), carbs (g), and fat (g). Be realistic with portion sizes based on visual cues.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
        },
      },
    });

    const text = response.text;
    if (!text) return [];

    const items = JSON.parse(text) as FoodItem[];
    return items;
  } catch (error) {
    console.error("Error analyzing food:", error);
    throw error;
  }
};