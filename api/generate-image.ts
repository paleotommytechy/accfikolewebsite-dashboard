// This is a new file: api/generate-image.ts
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required in the request body.' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      // This error is for the server logs, not for the user to see the key is missing.
      console.error("API_KEY environment variable is not set on the server.");
      return res.status(500).json({ message: 'Image generation service is not configured.' });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A cinematic, high-quality hero image for a blog post titled: "${prompt}". The image should be visually appealing and relevant to the title. No text in the image.`,
        config: {
          numberOfImages: 1,
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;

    return res.status(200).json({ base64Image: base64ImageBytes });

  } catch (error: any) {
    console.error('Error in generate-image API route:', error);
    // Avoid sending detailed internal errors to the client
    const errorMessage = error.message.includes('API key') 
      ? 'An error occurred with the image generation service.'
      : error.message;
    return res.status(500).json({ message: errorMessage || 'Internal Server Error' });
  }
}
