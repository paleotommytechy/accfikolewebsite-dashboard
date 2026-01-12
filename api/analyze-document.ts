
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { fileData, mimeType } = req.body;

    if (!fileData || !mimeType) {
        return res.status(400).json({ message: "File data and mimeType are required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return res.status(500).json({ message: 'AI service is not configured.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: mimeType, data: fileData } },
                { text: "Extract the academic course code (e.g., GST 101, MTH 202), the academic session/year (e.g. 2023/2024), and a suitable title for this document. If it looks like a Past Question, title it 'Past Question [Year]'. If it looks like a note, title it 'Lecture Note [Topic]'. Return JSON." }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    courseCode: { type: Type.STRING },
                    session: { type: Type.STRING },
                    title: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['past_question', 'lecture_note', 'other'] }
                }
            }
        }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("No response from AI");

    const data = JSON.parse(jsonStr);
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Error in analyze-document API route:', error);
    return res.status(500).json({ message: error.message || 'Analysis failed.' });
  }
}
