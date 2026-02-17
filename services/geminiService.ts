import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Project, ProjectMode, UserSkillLevel, User, ProjectPhase } from '../types';

// Define the response schema using the Type enum as per guidelines
const taskSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    assigneeIndex: { type: Type.INTEGER, description: "Index of the member in the provided members list to assign this task to. 0 for owner." },
  },
  required: ["title", "description", "assigneeIndex"]
};

const phaseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "e.g., 'Month 1: Foundation' or 'Phase 1: Setup'" },
    tasks: {
      type: Type.ARRAY,
      items: taskSchema
    }
  },
  required: ["title", "tasks"]
};

// Initial response is just ONE phase (the first one)
const responseSchema: Schema = {
  type: Type.ARRAY,
  items: phaseSchema
};

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    throw new Error("API Key is missing. Please set REACT_APP_GEMINI_API_KEY or similar.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const analyzeProjectWithGemini = async (
  projectDescription: string,
  mode: ProjectMode,
  skillLevel: UserSkillLevel,
  members: User[]
) => {
  const ai = getAiClient();
  const membersList = members.map((m, i) => `${i}: ${m.username}`).join(', ');
  
  const systemInstruction = `
    You are an expert Project Manager and Technical Tech Lead. 
    Your goal is to break down a software project idea into concrete, actionable phases and tasks.
    
    Context:
    - Mode: ${mode} (If 'Learn & Develop', focus on educational steps first. If 'Direct Develop', focus on shipping features).
    - Skill Level: ${skillLevel} (Adjust technical complexity).
    - Team Members (by index): ${membersList}.
    
    Requirements:
    - Create ONLY the FIRST PHASE (e.g., "Month 1" or "Phase 1: MVP Core"). Do NOT generate the whole project at once.
    - Inside this phase, list specific tasks.
    - Assign tasks effectively among the team members available using their index.
    - Return PURE JSON matching the schema.
  `;

  const prompt = `Project Description: ${projectDescription}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text); 
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const generateNextPhase = async (
  projectDescription: string,
  existingPhases: ProjectPhase[],
  mode: ProjectMode,
  skillLevel: UserSkillLevel,
  members: User[]
) => {
  const ai = getAiClient();
  const membersList = members.map((m, i) => `${i}: ${m.username}`).join(', ');
  const existingTitles = existingPhases.map(p => p.title).join(", ");

  const systemInstruction = `
    You are an expert Project Manager.
    The project has already completed these phases: ${existingTitles}.
    
    Context:
    - Mode: ${mode}
    - Skill Level: ${skillLevel}
    - Team Members: ${membersList}
    
    Requirements:
    - Generate ONLY the NEXT single phase (e.g., if "Month 1" is done, generate "Month 2").
    - Provide concrete tasks for this next phase.
    - Return PURE JSON array containing just this one new phase object.
  `;

  const prompt = `Project Description: ${projectDescription}. Generate the next phase.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text); 
  } catch (error) {
    console.error("Gemini Next Phase Failed:", error);
    throw error;
  }
};