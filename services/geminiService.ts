import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateWorkoutPlan = async (userPrompt: string): Promise<Task[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a fitness task list based on this request: "${userPrompt}". 
      Keep titles concise (under 10 words). Categorize them appropriately. 
      IMPORTANT: Duration must be a realistic estimate in minutes for a countdown timer. 
      Total duration of all tasks should match the user request if specified.
      Standard categories are 'Cardio', 'Strength', 'Flexibility', but you can use others if fitting.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "The name of the exercise or task" },
              category: { type: Type.STRING, description: "Category like Cardio, Strength, etc." },
              duration: { type: Type.NUMBER, description: "Duration in minutes (must be > 0)" }
            },
            required: ["title", "category", "duration"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const rawTasks = JSON.parse(text) as Array<{ title: string; category: string; duration: number }>;

    return rawTasks.map(t => ({
      id: generateId(),
      title: t.title,
      completed: false,
      category: t.category,
      duration: t.duration || 5, // Fallback duration
      createdAt: new Date().toISOString()
    }));

  } catch (error) {
    console.error("Error generating workout:", error);
    throw error;
  }
};