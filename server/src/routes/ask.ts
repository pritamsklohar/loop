import { Router } from 'express';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { Feedback, ChatSession } from '../models';
import { getEmbedding, cosineSimilarity } from '../services/ai';
import { requireAuth } from '../middleware/auth';

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'dummy_key'
});

const askSchema = z.object({
  question: z.string().min(1, 'Question is required')
});

// @route   GET /api/ask/history
// @desc    Get chat history for the user
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/history',
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const session = await ChatSession.findOne({
        userId: req.user!.id,
        workspaceId: req.user!.workspaceId
      });
      res.json(session ? session.messages : []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   DELETE /api/ask/history
// @desc    Clear chat history for the user
// @access  ADMIN, ANALYST, VIEWER
router.delete(
  '/history',
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const session = await ChatSession.findOne({
        userId: req.user!.id,
        workspaceId: req.user!.workspaceId
      });
      if (session) {
        session.messages = [];
        await session.save();
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/ask
// @desc    Ask a question grounded in feedback logs using embeddings & cosine similarity (Workspace scoped)
// @access  ADMIN, ANALYST, VIEWER
router.post(
  '/',
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const parsed = askSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { question } = parsed.data;
      const workspaceId = req.user!.workspaceId;

      // 1. Generate query embedding
      const queryEmbedding = await getEmbedding(question).catch(err => {
        console.error('Ask API: Failed to get query embedding:', err);
        return null;
      });

      if (!queryEmbedding) {
        res.status(500).json({ error: 'Failed to generate search embedding vector for question' });
        return;
      }

      // 2. Fetch all feedback logs in workspace that have embeddings populated
      const feedbacks = await Feedback.find({
        workspaceId,
        embedding: { $ne: null, $exists: true }
      });

      if (feedbacks.length === 0) {
        res.json({
          answer: "I'm sorry, but there are no classified feedback items with embeddings in this workspace to query. Please backfill or create some feedback logs first.",
          sources: []
        });
        return;
      }

      // 3. Compute cosine similarities in-memory
      const scoredFeedbacks = feedbacks.map(doc => {
        const similarity = cosineSimilarity(queryEmbedding, doc.embedding || []);
        return { doc, similarity };
      });

      // Sort by similarity descending
      scoredFeedbacks.sort((a, b) => b.similarity - a.similarity);

      // Take top K = 8 most relevant documents
      const topK = scoredFeedbacks.slice(0, 8);

      // Formulate context text block
      const contextText = topK
        .map((item, idx) => `[Source ${idx + 1}] ID: ${item.doc._id.toString()}\nChannel: ${item.doc.channel}\nContent: ${item.doc.content}`)
        .join('\n\n');

      // 4. Construct grounded OpenAI response prompt
      const systemPrompt = `You are a helpful customer feedback analyzer for Project LOOP.
Your goal is to answer the user's question about customer feedback based ONLY on the context provided below.

CONTEXT:
${contextText}

RULES:
1. Answer the question using ONLY the provided feedback logs.
2. If the answer cannot be determined or is not present in the context, state: "I'm sorry, but there is no customer feedback in the active database referencing that topic."
3. Do NOT make up, assume, or invent any feedback logs or customer details.
4. Keep your answer brief, concise, and grounded in the source data.
5. Refer to sources using [Source 1], [Source 2], etc. inside your text where relevant to cite your claims.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Question: ${question}`,
        config: {
          systemInstruction: systemPrompt
        }
      });

      const answer = response.text || "No answer generated.";

      // 5. Gather citation details for UI mapping
      const sources = topK.map(item => ({
        feedbackId: item.doc._id.toString(),
        snippet: item.doc.content.substring(0, 120) + (item.doc.content.length > 120 ? '...' : '')
      }));

      // 6. Save to ChatSession
      let session = await ChatSession.findOne({
        userId: req.user!.id,
        workspaceId
      });

      if (!session) {
        session = new ChatSession({
          userId: req.user!.id,
          workspaceId,
          messages: []
        });
      }

      session.messages.push({
        id: `user-${Date.now()}`,
        sender: 'user',
        text: question,
        createdAt: new Date()
      });

      session.messages.push({
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: answer,
        sources,
        createdAt: new Date()
      });

      await session.save();

      res.status(200).json({
        answer,
        sources
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
