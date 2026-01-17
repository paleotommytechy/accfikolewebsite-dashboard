import { GoogleGenAI, Type } from "@google/genai";

// Increase body size limit for file uploads (multimodal analysis)
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
    const { type, content, mimeType, customTopic, courseInfo } = req.body;

    // FIX: Initialize GoogleGenAI with process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let prompt = "";
    let responseSchema: any = null;

    if (type === 'tips') {
      prompt = `Provide exam strategy and study tips for ${courseInfo}. ${customTopic ? `Focus specifically on: ${customTopic}.` : ''} Output as an object with a field "text" containing markdown formatted advice.`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Markdown formatted study advice." }
        },
        required: ["text"]
      };
    } else {
      prompt = `Generate 5 multiple choice questions for ${courseInfo}. ${customTopic ? `Focus on: ${customTopic}.` : ''} Each question must have 4 options and one correct_option_index (0-3). Output as JSON.`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                correct_option_index: { type: Type.INTEGER, minimum: 0, maximum: 3 }
              },
              required: ["question_text", "options", "correct_option_index"]
            }
          }
        },
        required: ["questions"]
      };
    }

    const parts: any[] = [];
    if (content && mimeType) {
      // For multimodal analysis (image/PDF)
      parts.push({ inlineData: { data: content, mimeType } });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    // FIX: Access response.text property directly as per guidelines
    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("No response from AI");

    return res.status(200).json(JSON.parse(jsonStr));

  } catch (error: any) {
    console.error('Error in learning-content API route:', error);
    return res.status(500).json({ message: error.message || 'Generation failed.' });
  }
}