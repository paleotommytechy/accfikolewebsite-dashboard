import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    // FIX: Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        // FIX: Use 'gemini-3-flash-preview' for basic text tasks
        model: 'gemini-3-flash-preview',
        contents: "Provide a single, inspiring and encouraging bible verse for a Christian fellowship dashboard. Your response must be only the JSON object, with no extra text or markdown.",
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    verse_reference: { type: Type.STRING, description: "The book, chapter, and verse (e.g., John 3:16)" },
                    verse_text: { type: Type.STRING, description: "The full text of the verse." },
                },
                required: ['verse_reference', 'verse_text']
            }
        }
    });

    // FIX: Access response.text property directly as per guidelines (not a method call)
    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("No response from AI");
    
    const newScripture = JSON.parse(jsonStr);
    return res.status(200).json(newScripture);

  } catch (error: any) {
    console.error('Error in daily-scripture API route:', error);
    const errorMessage = error.message || 'Failed to generate scripture.';
    return res.status(500).json({ message: errorMessage });
  }
}