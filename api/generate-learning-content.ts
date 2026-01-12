
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { type, content, mimeType, customTopic, courseInfo } = req.body;
    // type: 'quiz' | 'tips'
    // content: text string OR base64 string
    // mimeType: if content is base64 file data

    if (!content) {
        return res.status(400).json({ message: "Content is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return res.status(500).json({ message: 'AI service is not configured.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    let geminiResponse;

    // Common parts
    const parts: any[] = [];
    if (mimeType) {
        parts.push({ inlineData: { mimeType, data: content } });
    } else {
        parts.push({ text: `Content:\n${content}` });
    }

    const topicFocus = customTopic ? `Focus specifically on: "${customTopic}".` : '';
    const courseContext = courseInfo ? `Context: ${courseInfo}.` : '';

    if (type === 'tips') {
        const prompt = `Role: Academic Coach. ${courseContext} ${topicFocus} Task: Analyze the provided content (or the first few pages if a document). Provide 3-5 specific, high-impact study tips to pass an exam on this topic. Highlight pitfalls. Format: Markdown bullets.`;
        parts.push({ text: prompt });

        geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts }
        });

        return res.status(200).json({ text: geminiResponse.text });

    } else if (type === 'quiz') {
        const systemPrompt = `Role: Examiner. Task: Create 5 multiple-choice questions based on the provided content. ${topicFocus} Output: JSON Array only. Schema: [{question_text: string, options: string[], correct_option_index: number}].`;
        parts.push({ text: systemPrompt });

        geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question_text: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correct_option_index: { type: Type.INTEGER }
                        }
                    }
                }
            }
        });

        const jsonStr = geminiResponse.text?.trim();
        if (!jsonStr) throw new Error("No quiz generated");
        
        return res.status(200).json({ questions: JSON.parse(jsonStr) });
    } else {
        return res.status(400).json({ message: "Invalid type requested" });
    }

  } catch (error: any) {
    console.error('Error in generate-learning-content API route:', error);
    return res.status(500).json({ message: error.message || 'Generation failed.' });
  }
}
