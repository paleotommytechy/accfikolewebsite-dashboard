
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return res.status(500).json({ message: 'AI service is not configured.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
