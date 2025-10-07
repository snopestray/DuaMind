// This is a serverless function. 
// If you deploy to Vercel, this file will be automatically detected.

import { GoogleGenAI } from "@google/genai";

// This is the function that will be executed when the frontend calls /api/generate
export async function POST(req: Request) {
  try {
    const { userPrompt, systemInstruction } = await req.json();

    if (!userPrompt) {
      return new Response(JSON.stringify({ error: 'User prompt is required' }), { status: 400 });
    }

    // IMPORTANT: Get the API key from environment variables on the server.
    // Do NOT expose this key to the client.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured on server' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: { systemInstruction },
    });
    
    // Send only the necessary data back to the frontend.
    return new Response(JSON.stringify({ text: response.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate function:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate content' }), { status: 500 });
  }
}
