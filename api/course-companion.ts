import { GoogleGenAI } from "@google/genai";

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
    const { userPrompt, courseContext, fileData, mimeType } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ message: 'User prompt is required.' });
    }

    // FIX: Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `You are an AI Course Companion for the All Christian Campus Fellowship Ikole Ekiti chapter at Federal University of Oye Ekiti. Your role is to act as a helpful tutor. Based on the user's question and the provided course materials, answer their query concisely. You can summarize topics, explain concepts, or help locate information within the provided materials. If the materials don't contain the answer, politely state that the information is not available in the provided context. Format your answers clearly using Markdown, but do not use H1 or H2 markdown tags.`;
    
    let contents: any;

    if (fileData && mimeType) {
        // Multimodal request with a file
        contents = {
            parts: [
                { text: userPrompt },
                { inlineData: { data: fileData, mimeType } }
            ]
        };
    } else {
        // Text-only request using course context from the database
        const fullPrompt = `${userPrompt}\n\nUse the following context if relevant:\n${courseContext || 'No specific course materials were found for this question.'}`;
        contents = fullPrompt;
    }

    const response = await ai.models.generateContent({
        // FIX: Use 'gemini-3-flash-preview' for assistant tasks
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
            systemInstruction: systemInstruction
        }
    });
    
    // FIX: Access response.text property directly as per guidelines (not a method call)
    const answer = response.text;

    return res.status(200).json({ answer });

  } catch (error: any) {
    console.error('Error in course-companion API route:', error);
    const errorMessage = error.message || 'An internal server error occurred while generating the answer.';
    return res.status(500).json({ message: errorMessage });
  }
}