import { Router } from 'express';
import mongoose from 'mongoose';
import { Feedback, Theme } from '../models';
import { requireAuth, requireWorkspaceScope } from '../middleware/auth';

const router = Router();

// @route   GET /api/insights/summary
// @desc    Get dashboard metrics & aggregation reports (Workspace scoped)
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/summary',
  requireAuth,
  requireWorkspaceScope,
  async (req, res): Promise<void> => {
    try {
      const channel = req.query.channel as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // 1. Build workspace scoped filter
      const filter: any = { workspaceId: new mongoose.Types.ObjectId(req.user!.workspaceId) };

      if (channel) {
        filter.channel = channel;
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

      // 2. Fetch total count matching filters
      const totalFeedbackCount = await Feedback.countDocuments(filter);

      // 3. Fetch new feedback items this week (created in last 7 days, ignoring date range filters)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newThisWeek = await Feedback.countDocuments({
        workspaceId: new mongoose.Types.ObjectId(req.user!.workspaceId),
        createdAt: { $gte: oneWeekAgo }
      });

      // 4. Aggregate sentiment breakdown
      const sentimentAggregation = await Feedback.aggregate([
        { $match: filter },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } }
      ]);

      const sentimentBreakdown = { POS: 0, NEU: 0, NEG: 0, UNASSIGNED: 0 };
      sentimentAggregation.forEach(group => {
        if (group._id === 'POS') sentimentBreakdown.POS = group.count;
        else if (group._id === 'NEU') sentimentBreakdown.NEU = group.count;
        else if (group._id === 'NEG') sentimentBreakdown.NEG = group.count;
        else sentimentBreakdown.UNASSIGNED += group.count;
      });

      // Calculate % negative
      const negativePercentage = totalFeedbackCount > 0 
        ? Math.round((sentimentBreakdown.NEG / totalFeedbackCount) * 100)
        : 0;

      // 5. Aggregate volume over time (grouped by day)
      const volumeAggregation = await Feedback.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const volumeOverTime = volumeAggregation.map(item => ({
        date: item._id,
        count: item.count
      }));

      // 6. Aggregate top 5 themes by count
      const themeAggregation = await Feedback.aggregate([
        { $match: filter },
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

      const themeIds = themeAggregation.map(item => item._id);
      const themes = await Theme.find({ _id: { $in: themeIds } });
      const themeMap = new Map(themes.map(t => [t._id.toString(), t]));

      const topThemes = themeAggregation.map(item => {
        const themeDoc = themeMap.get(item._id.toString());
        return {
          name: themeDoc ? themeDoc.name : 'Unknown Theme',
          color: themeDoc ? themeDoc.color : '#64748B',
          count: item.count
        };
      });

      res.status(200).json({
        totalFeedbackCount,
        negativePercentage,
        newThisWeek,
        volumeOverTime,
        sentimentBreakdown,
        topThemes
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/insights/trends
// @desc    Get themes trend volume compared with prior 7-day period (Workspace scoped)
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/trends',
  requireAuth,
  requireWorkspaceScope,
  async (req, res): Promise<void> => {
    try {
      const themes = await Theme.find({ workspaceId: req.user!.workspaceId });

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const trends = await Promise.all(
        themes.map(async (theme) => {
          const currentCount = await Feedback.countDocuments({
            workspaceId: req.user!.workspaceId,
            'themeIds.themeId': theme._id,
            createdAt: { $gte: sevenDaysAgo, $lte: now }
          });

          const previousCount = await Feedback.countDocuments({
            workspaceId: req.user!.workspaceId,
            'themeIds.themeId': theme._id,
            createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
          });

          const diff = currentCount - previousCount;
          const pctChange = previousCount > 0 
            ? Math.round((diff / previousCount) * 100)
            : currentCount > 0 ? 100 : 0;

          let trendStatus: 'spiking' | 'up' | 'down' | 'stable' = 'stable';
          if (pctChange >= 30 && currentCount > previousCount) {
            trendStatus = 'spiking';
          } else if (pctChange > 0) {
            trendStatus = 'up';
          } else if (pctChange < 0) {
            trendStatus = 'down';
          }

          const allTimeCount = await Feedback.countDocuments({
            workspaceId: req.user!.workspaceId,
            'themeIds.themeId': theme._id,
          });

          return {
            _id: theme._id,
            name: theme.name,
            color: theme.color,
            description: theme.description,
            currentCount,
            previousCount,
            allTimeCount,
            pctChange,
            status: trendStatus
          };
        })
      );

      // Sort trends by feedback count descending
      trends.sort((a, b) => b.currentCount - a.currentCount);
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
