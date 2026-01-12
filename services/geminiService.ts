import { GoogleGenAI } from "@google/genai";
import { Task, TaskStatus } from '../types';
import { GEMINI_MODEL_FLASH } from '../constants';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDailySummary = async (date: string, tasks: Task[]): Promise<string> => {
  try {
    const ai = getClient();
    
    if (tasks.length === 0) {
      return "No tasks recorded for this day.";
    }

    const tasksData = tasks.map(t => ({
      title: t.title,
      status: t.status,
      notes: t.notes || "No notes",
      links: t.links.map(l => l.label).join(", ") || "No links"
    }));

    const prompt = `
      You are a professional Project Manager assistant. 
      Generate a concise but professional end-of-day report for ${date} based on the following tasks.
      
      Tasks:
      ${JSON.stringify(tasksData, null, 2)}
      
      Structure the report with these sections using Markdown:
      1. 🏆 Achievements (Completed tasks)
      2. 🚧 In Progress (Tasks started but not finished)
      3. 📝 Pending (To-do items)
      4. 💡 Summary & Next Steps (A brief synthesis of the day's effort and suggested focus for tomorrow).
      
      Keep it professional, encouraging, and clear.
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FLASH,
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
