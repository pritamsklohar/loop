import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import Papa from 'papaparse';
import { Feedback } from '../models';
import { requireAuth, requireWorkspaceScope, requireRole } from '../middleware/auth';
import { appStoreFixtures, supportFixtures, socialFixtures } from '../fixtures/simulatedFeedback';
import { classifyFeedbackDocument } from '../services/classifier';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const feedbackCreateSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  channel: z.enum(['support_ticket', 'app_store', 'nps_survey', 'sales_call', 'community_post']),
  sourceRef: z.string().optional(),
  customerLabel: z.string().optional()
});

// @route   POST /api/feedback
// @desc    Create a single feedback item (Workspace scoped)
// @access  ANALYST, ADMIN
router.post(
  '/',
  requireAuth,
  requireWorkspaceScope,
  requireRole('ADMIN', 'ANALYST'),
  async (req, res): Promise<void> => {
    try {
      const parsed = feedbackCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { content, channel, sourceRef, customerLabel } = parsed.data;

      // Scoped workspaceId comes directly from JWT payload, never client input
      const feedback = await Feedback.create({
        content,
        channel,
        sourceRef: sourceRef || `user-submitted-${Date.now()}`,
        customerLabel: customerLabel || 'Anonymous',
        status: 'NEW',
        workspaceId: req.user!.workspaceId as any
      });

      // Trigger background classification (non-blocking)
      classifyFeedbackDocument(feedback._id.toString()).catch(err => {
        console.error(`Failed background classification for single doc ${feedback._id}:`, err);
      });

      res.status(201).json(feedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/feedback
// @desc    Get paginated feedback list (Workspace scoped)
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/',
  requireAuth,
  requireWorkspaceScope,
  requireRole('ADMIN', 'ANALYST', 'VIEWER'),
  async (req, res): Promise<void> => {
    try {
      const search = req.query.search as string;
      const channel = req.query.channel as string;
      const status = req.query.status as string;
      const sentiment = req.query.sentiment as string;
      const theme = req.query.theme as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const filter: any = { ...req.workspaceFilter };

      if (search) {
        filter.$or = [
          { content: { $regex: search, $options: 'i' } }
        ];
      }
      if (channel) {
        filter.channel = channel;
      }
      if (status) {
        filter.status = status;
      }
      if (sentiment) {
        if (sentiment === 'null') {
          filter.sentiment = null;
        } else {
          filter.sentiment = sentiment;
        }
      }
      if (theme) {
        filter['themeIds.themeId'] = theme;
      }
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }

      const total = await Feedback.countDocuments(filter);
      const items = await Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        feedback: items,
        total,
        page,
        pages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

const csvRowSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  channel: z.enum(['support_ticket', 'app_store', 'nps_survey', 'sales_call', 'community_post']),
  customer_label: z.string().optional(),
  created_at: z.string().optional()
});

// @route   POST /api/feedback/bulk-upload
// @desc    Bulk upload feedback via CSV (Workspace scoped)
// @access  ANALYST, ADMIN
router.post(
  '/bulk-upload',
  requireAuth,
  requireWorkspaceScope,
  requireRole('ADMIN', 'ANALYST'),
  upload.single('file'),
  async (req, res): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Please upload a CSV file.' });
        return;
      }

      const csvData = req.file.buffer.toString('utf-8');
      
      const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        res.status(400).json({ error: 'Failed to parse CSV: ' + parsed.errors[0].message });
        return;
      }

      const rows = parsed.data as any[];
      const validRows: any[] = [];
      const failedRows: { row: number; error: string; data: any }[] = [];

      rows.forEach((row, idx) => {
        // Clean values
        const cleanRow = {
          content: row.content?.trim(),
          channel: row.channel?.trim(),
          customer_label: row.customer_label?.trim(),
          created_at: row.created_at?.trim()
        };

        const result = csvRowSchema.safeParse(cleanRow);
        if (result.success) {
          let createdAtDate = new Date();
          if (cleanRow.created_at) {
            const parsedDate = new Date(cleanRow.created_at);
            if (!isNaN(parsedDate.getTime())) {
              createdAtDate = parsedDate;
            }
          }
          
          validRows.push({
            content: result.data.content,
            channel: result.data.channel,
            customerLabel: result.data.customer_label || 'Anonymous',
            sourceRef: `bulk-upload-${Date.now()}-${idx}`,
            status: 'NEW',
            workspaceId: req.user!.workspaceId,
            createdAt: createdAtDate
          });
        } else {
          failedRows.push({
            row: idx + 2, // 1-based index (header is line 1)
            error: result.error.issues.map(i => i.message).join(', '),
            data: row
          });
        }
      });

      if (validRows.length > 0) {
        const createdDocs = await Feedback.insertMany(validRows);
        // Process sequentially in the background to avoid AI rate limits and DB pressure
        (async () => {
          for (const doc of createdDocs) {
            try {
              await classifyFeedbackDocument(doc._id as string);
            } catch (err) {
              console.error(`Failed background classification for bulk doc ${doc._id}:`, err);
            }
          }
        })();
      }

      res.status(200).json({
        imported: validRows.length,
        failed: failedRows.length,
        errors: failedRows
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/feedback/simulate/:channel
// @desc    Simulate batch feedback entries (Workspace scoped)
// @access  ADMIN, ANALYST
router.post(
  '/simulate/:channel',
  requireAuth,
  requireWorkspaceScope,
  requireRole('ADMIN', 'ANALYST'),
  async (req, res): Promise<void> => {
    try {
      const channel = req.params.channel as string;

      if (!['app_store', 'support', 'social'].includes(channel)) {
        res.status(400).json({ error: 'Invalid channel. Must be app_store, support, or social.' });
        return;
      }

      let fixtures = [];
      let dbChannel = '';

      if (channel === 'app_store') {
        fixtures = appStoreFixtures;
        dbChannel = 'app_store';
      } else if (channel === 'support') {
        fixtures = supportFixtures;
        dbChannel = 'support_ticket';
      } else {
        fixtures = socialFixtures;
        dbChannel = 'community_post';
      }

      const feedbackToInsert = fixtures.map(item => {
        const randomDaysAgo = Math.floor(Math.random() * 30);
        const randomHoursAgo = Math.floor(Math.random() * 24);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - randomDaysAgo);
        createdAt.setHours(createdAt.getHours() - randomHoursAgo);

        return {
          content: item.content,
          channel: dbChannel,
          customerLabel: item.customerLabel,
          sourceRef: `${item.sourceRef}-${Date.now()}`,
          status: 'NEW',
          sentiment: null,
          sentimentScore: null,
          themeIds: [],
          embedding: null,
          workspaceId: req.user!.workspaceId,
          createdAt
        };
      });

      const createdDocs = await Feedback.insertMany(feedbackToInsert as any);
      // Trigger background classification for all simulated docs
      createdDocs.forEach(doc => {
        classifyFeedbackDocument(doc._id as string).catch(err => {
          console.error(`Failed background classification for simulated doc ${doc._id}:`, err);
        });
      });

      res.status(200).json({
        count: feedbackToInsert.length,
        message: `Successfully simulated ${feedbackToInsert.length} items for ${channel}`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

const statusUpdateSchema = z.object({
  status: z.enum(['NEW', 'REVIEWED', 'ACTIONED'])
});

// @route   PATCH /api/feedback/:id/status
// @desc    Update feedback status (Workspace scoped)
// @access  ADMIN, ANALYST
router.patch(
  '/:id/status',
  requireAuth,
  requireWorkspaceScope,
  requireRole('ADMIN', 'ANALYST'),
  async (req, res): Promise<void> => {
    try {
      const parsed = statusUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { status } = parsed.data;
      const { id } = req.params;

      const feedback = await Feedback.findOneAndUpdate(
        { _id: id, workspaceId: req.user!.workspaceId },
        { status },
        { new: true }
      );

      if (!feedback) {
        res.status(404).json({ error: 'Feedback log not found in your workspace' });
        return;
      }

      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/feedback/:id/classify
// @desc    Manually trigger AI classification for a feedback log (Workspace scoped)
// @access  ADMIN, ANALYST
router.post(
  '/:id/classify',
  requireAuth,
  requireWorkspaceScope,
  requireRole('ADMIN', 'ANALYST'),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;

      const doc = await Feedback.findOne({ _id: id, workspaceId: req.user!.workspaceId });
      if (!doc) {
        res.status(404).json({ error: 'Feedback log not found in your workspace' });
        return;
      }

      await classifyFeedbackDocument(doc._id.toString());
      
      const updatedDoc = await Feedback.findById(doc._id);
      res.json(updatedDoc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
