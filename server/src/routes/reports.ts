import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { Report, Feedback, Theme } from '../models';
import { requireAuth, requireWorkspaceScope } from '../middleware/auth';

const router = Router();



const generateSchema = z.object({
  periodStart: z.string().min(1, 'Period start date is required'),
  periodEnd: z.string().min(1, 'Period end date is required')
});

// @route   POST /api/reports/generate
// @desc    Generate VoC Insights Report dynamically grounded in precomputed statistics (Workspace scoped)
// @access  ADMIN, ANALYST
router.post(
  '/generate',
  requireAuth,
  requireWorkspaceScope,
  async (req, res): Promise<void> => {
    try {
      const parsed = generateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { periodStart, periodEnd } = parsed.data;
      const workspaceId = req.user!.workspaceId;

      const start = new Date(periodStart);
      const end = new Date(periodEnd);
      end.setHours(23, 59, 59, 999);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ error: 'Invalid start or end date format.' });
        return;
      }

      // Calculate previous period of equal length
      const durationMs = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - durationMs);
      const prevEnd = new Date(start.getTime() - 1);

      // --- Pre-compute 1: Top Themes with Counts ---
      const themeCountsAggregation = await Feedback.aggregate([
        {
          $match: {
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
            createdAt: { $gte: start, $lte: end }
          }
        },
        { $unwind: '$themeIds' },
        {
          $group: {
            _id: '$themeIds.themeId',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      const themeIds = themeCountsAggregation.map(item => item._id);
      const themes = await Theme.find({ _id: { $in: themeIds } });
      const themeMap = new Map(themes.map(t => [t._id.toString(), t.name]));
      const topThemes = themeCountsAggregation.map(item => ({
        name: themeMap.get(item._id.toString()) || 'Unknown Theme',
        count: item.count
      }));

      // --- Pre-compute 2: Sentiment Shift vs Previous Period ---
      const currentFeedbacks = await Feedback.find({
        workspaceId,
        createdAt: { $gte: start, $lte: end },
        sentimentScore: { $ne: null }
      });

      const prevFeedbacks = await Feedback.find({
        workspaceId,
        createdAt: { $gte: prevStart, $lte: prevEnd },
        sentimentScore: { $ne: null }
      });

      const currentAvg = currentFeedbacks.length > 0
        ? currentFeedbacks.reduce((sum, f) => sum + (f.sentimentScore || 0), 0) / currentFeedbacks.length
        : 0;

      const prevAvg = prevFeedbacks.length > 0
        ? prevFeedbacks.reduce((sum, f) => sum + (f.sentimentScore || 0), 0) / prevFeedbacks.length
        : 0;

      const shift = currentAvg - prevAvg;
      const sentimentShift = {
        current: Math.round(currentAvg * 100) / 100,
        previous: Math.round(prevAvg * 100) / 100,
        shift: Math.round(shift * 100) / 100
      };

      // --- Pre-compute 3: 3-5 Representative Verbatim Quotes ---
      const pool = await Feedback.find({
        workspaceId,
        createdAt: { $gte: start, $lte: end }
      })
      .sort({ sentimentScore: 1 })
      .limit(15);

      const sortedByScore = [...pool].sort((a, b) => (b.sentimentScore || 0) - (a.sentimentScore || 0));
      const pickedQuotes: string[] = [];

      if (sortedByScore.length > 0) {
        // Mix positive and negative
        const pos = sortedByScore.slice(0, 2).map(f => f.content);
        const neg = sortedByScore.slice(-2).map(f => f.content);
        pickedQuotes.push(...new Set([...pos, ...neg]));
      } else {
        const fallback = await Feedback.find({
          workspaceId,
          createdAt: { $gte: start, $lte: end }
        }).limit(4);
        pickedQuotes.push(...fallback.map(f => f.content));
      }
      const verbatimQuotes = pickedQuotes.slice(0, 5);

      // --- Generate Summary & Action Items using OpenAI (gpt-4o-mini) ---
      let narrative = {
        summary: "No narrative generated due to insufficient context data or missing AI configuration.",
        recommendedActions: [
          "Establish baseline feedback ingestion pipelines.",
          "Check workspace setup details.",
          "Manually audit newly ingested items."
        ]
      };

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (geminiApiKey && geminiApiKey !== 'dummy_key' && !geminiApiKey.startsWith('dummy')) {
        const prompt = `You are a Customer Experience Analyst at Project LOOP.
Write a grounded executive summary and action items based strictly on these Voice of the Customer (VoC) metrics.

METRICS FOR PERIOD (${start.toLocaleDateString()} to ${end.toLocaleDateString()}):
- Top Themes with counts:
${topThemes.length > 0 ? topThemes.map(t => `  * ${t.name}: ${t.count} reviews`).join('\n') : '  * (No themes matched)'}
- Sentiment Shift: Average score this period is ${sentimentShift.current} vs ${sentimentShift.previous} previously (scale of -1.0 to 1.0, where positive shift is improvement).
- Customer Verbatim Quotes:
${verbatimQuotes.length > 0 ? verbatimQuotes.map(q => `  * "${q}"`).join('\n') : '  * (No quotes available)'}

INSTRUCTIONS:
Your output must be a structured JSON response exactly matching this schema:
{
  "summary": "Concise executive paragraph summarizing the customer voices, highlighting themes and shifts.",
  "recommendedActions": ["action item 1", "action item 2"]
}
Do NOT invent new metrics or hallucinate counts.`;

        try {
          const ai = new GoogleGenAI({ apiKey: geminiApiKey });
          
          const completion = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          });

          if (completion.text) {
            const parsed = JSON.parse(completion.text);
            const ReportSchema = z.object({
              summary: z.string(),
              recommendedActions: z.array(z.string())
            });
            narrative = ReportSchema.parse(parsed);
          }
        } catch (err) {
          console.error("Report Generator: Gemini summary generation failed, using fallbacks:", err);
        }
      }

      // --- Save Report ---
      const reportTitle = `VoC Digest: ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      
      const contentJson = {
        stats: {
          topThemes,
          sentimentShift,
          verbatimQuotes
        },
        narrative
      };

      const newReport = await Report.create({
        title: reportTitle,
        periodStart: start,
        periodEnd: end,
        contentJson,
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        generatedBy: new mongoose.Types.ObjectId(req.user!.id)
      });

      res.status(201).json(newReport);

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/reports
// @desc    List all generated reports in the workspace (Workspace scoped)
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/',
  requireAuth,
  requireWorkspaceScope,
  async (req, res): Promise<void> => {
    try {
      const reports = await Report.find({ workspaceId: req.user!.workspaceId })
        .sort({ createdAt: -1 });
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/reports/:id
// @desc    Get a specific report details (Workspace scoped)
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/:id',
  requireAuth,
  requireWorkspaceScope,
  async (req, res): Promise<void> => {
    try {
      const id = req.params.id as string;
      const report = await Report.findOne({
        _id: new mongoose.Types.ObjectId(id),
        workspaceId: req.user!.workspaceId
      });

      if (!report) {
        res.status(404).json({ error: 'Report not found in your workspace' });
        return;
      }

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/reports/:id/public
// @desc    Get public details of a report (No authentication required)
// @access  PUBLIC
router.get(
  '/:id/public',
  async (req, res): Promise<void> => {
    try {
      const id = req.params.id as string;
      const report = await Report.findById(id);

      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
