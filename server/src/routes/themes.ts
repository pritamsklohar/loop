import { Router } from 'express';
import mongoose from 'mongoose';
import { Theme, Feedback } from '../models';
import { requireAuth, requireWorkspaceScope } from '../middleware/auth';

const router = Router();

// @route   GET /api/themes
// @desc    List all workspace themes with feedback count (Workspace scoped)
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/',
  requireAuth,
  requireWorkspaceScope,
  async (req, res): Promise<void> => {
    try {
      const themesAggregation = await Theme.aggregate([
        { $match: { workspaceId: new mongoose.Types.ObjectId(req.user!.workspaceId) } },
        {
          $lookup: {
            from: 'feedbacks',
            let: { themeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$workspaceId', new mongoose.Types.ObjectId(req.user!.workspaceId)] },
                      { $in: ['$$themeId', '$themeIds.themeId'] }
                    ]
                  }
                }
              }
            ],
            as: 'feedbacks'
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            color: 1,
            workspaceId: 1,
            feedbackCount: { $size: '$feedbacks' }
          }
        },
        { $sort: { feedbackCount: -1, name: 1 } }
      ]);

      res.json(themesAggregation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/themes/:id/feedback
// @desc    Get paginated list of feedback logs belonging to a theme (Workspace scoped)
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/:id/feedback',
  requireAuth,
  requireWorkspaceScope,
  async (req, res): Promise<void> => {
    try {
      const id = req.params.id as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const filter = {
        workspaceId: new mongoose.Types.ObjectId(req.user!.workspaceId),
        'themeIds.themeId': new mongoose.Types.ObjectId(id)
      };

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

export default router;
