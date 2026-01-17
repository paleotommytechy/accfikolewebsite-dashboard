import { GoogleGenAI, Type } from "@google/genai";

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

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

    // FIX: Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        // FIX: Use 'gemini-3-flash-preview' for general tasks
        model: 'gemini-3-flash-preview',
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

    // FIX: Access response.text property directly as per guidelines (not a method call)
    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("No response from AI");

    const data = JSON.parse(jsonStr);
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Error in analyze-document API route:', error);
    return res.status(500).json({ message: error.message || 'Analysis failed.' });
  }
}