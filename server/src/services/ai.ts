import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'dummy_key'
});

export const classificationSchema = z.object({
  sentiment: z.enum(['POS', 'NEU', 'NEG']),
  sentimentScore: z.number(),
  themes: z.array(z.string()),
  featureArea: z.string(),
  rationale: z.string()
});

export type ClassificationResult = z.infer<typeof classificationSchema>;

export async function classifyFeedback(
  text: string,
  existingThemeNames: string[]
): Promise<ClassificationResult> {
  const systemPrompt = `You are an AI feedback classifier for Project LOOP.
Analyze the customer feedback text and output a structured JSON response exactly matching this schema:
{
  "sentiment": "POS" | "NEU" | "NEG",
  "sentimentScore": number (between -1.0 and 1.0),
  "themes": string[],
  "featureArea": string,
  "rationale": string
}

GUIDELINES:
1. Re-use existing theme names where relevant instead of inventing new ones. Here is the list of existing theme names:
${JSON.stringify(existingThemeNames, null, 2)}
2. sentimentScore must be a number between -1.0 (highly negative) and 1.0 (highly positive).`;

  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: `Classify this feedback:\n\n"${text}"`,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json'
    }
  });

  if (!response.text) {
    throw new Error('No text generated from Gemini');
  }

  const json = JSON.parse(response.text);
  return classificationSchema.parse(json);
}

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'dummy_key' || apiKey.startsWith('dummy')) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const vector: number[] = [];
    // Gemini gemini-embedding-2 is 3072 dimensions by default
    for (let i = 0; i < 3072; i++) {
      const val = Math.sin(hash + i) * 0.5 + 0.5;
      vector.push(val);
    }
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / (magnitude || 1));
  }

  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: text,
  });

  if (!response.embeddings || !response.embeddings[0] || !response.embeddings[0].values) {
    throw new Error('Failed to generate embedding');
  }

  return response.embeddings[0].values;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
