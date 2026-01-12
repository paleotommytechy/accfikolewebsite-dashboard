
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { userPrompt, courseContext } = req.body;

    if (!userPrompt || !courseContext) {
      return res.status(400).json({ message: 'User prompt and course context are required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return res.status(500).json({ message: 'AI service is not configured.' });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are an expert academic advisor and study planner for a Christian university fellowship. Your goal is to create clear, actionable, and encouraging study schedules.
    
    Based on the user's request and the provided materials, create a daily study plan leading up to the test date. The plan should be structured, easy to follow, and reference the specific materials provided.
    
    Start with an encouraging sentence. If no specific materials are found for the requested course, politely inform the user and suggest they ask an admin to upload them.
    
    Format the output using Markdown with lists and bold text for clarity. Do not use H1 or H2 markdown tags.`;
    
    const fullPrompt = `## System Instruction:\n${systemInstruction}\n\n## User Request:\n${userPrompt}\n\n## Available Course Materials:\n${courseContext}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
    });
    
    const studyPlan = response.text;

    return res.status(200).json({ plan: studyPlan });

  } catch (error: any) {
    console.error('Error in generate-study-plan API route:', error);
    const errorMessage = error.message || 'An internal server error occurred while generating the study plan.';
    return res.status(500).json({ message: errorMessage });
  }
}
