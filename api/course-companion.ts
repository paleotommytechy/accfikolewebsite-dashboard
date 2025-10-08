// This is a new file: api/course-companion.ts
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

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable is not set on the server.");
      return res.status(500).json({ message: 'AI service is not configured.' });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are an AI Course Companion for a Christian university fellowship. Your role is to act as a helpful tutor. Based on the user's question and the provided course materials, answer their query concisely. You can summarize topics, explain concepts, or help locate information within the provided materials. If the materials don't contain the answer, politely state that the information is not available in the provided context. Format your answers clearly using Markdown, but do not use H1 or H2 markdown tags.`;
    
    const fullPrompt = `## System Instruction:\n${systemInstruction}\n\n## User Question:\n${userPrompt}\n\n## Available Course Materials for Context:\n${courseContext}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
    });
    
    const answer = response.text;

    return res.status(200).json({ answer });

  } catch (error: any) {
    console.error('Error in course-companion API route:', error);
    const errorMessage = error.message || 'An internal server error occurred while generating the answer.';
    return res.status(500).json({ message: errorMessage });
  }
}