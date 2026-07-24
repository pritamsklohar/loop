import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, Theme, Workspace } from '../models';
import { requireAuth, requireWorkspaceScope, requireRole } from '../middleware/auth';

const router = Router();

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER'])
});

const inviteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER'])
});

// @route   GET /api/workspace
// @desc    Get current workspace details
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/',
  requireAuth,
  requireWorkspaceScope,
  async (req, res): Promise<void> => {
    try {
      const workspace = await Workspace.findById(req.user!.workspaceId);
      if (!workspace) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }
      res.json(workspace);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/workspace/members
// @desc    Get all members of the workspace
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/members',
  requireAuth,
  requireWorkspaceScope,
  requireRole('ADMIN', 'ANALYST', 'VIEWER'),
  async (req, res): Promise<void> => {
    try {
      const members = await User.find(req.workspaceFilter!).select('-passwordHash');
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   PATCH /api/workspace/members/:userId/role
// @desc    Change member role (Workspace scoped)
// @access  ADMIN
router.patch(
  '/members/:userId/role',
  requireAuth,
  requireWorkspaceScope,
  requireRole('ADMIN'),
  async (req, res): Promise<void> => {
    try {
      const parsed = roleSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { role } = parsed.data;
      const { userId } = req.params;

      // Scoped using workspaceId from JWT to prevent updating other tenants
      const member = await User.findOneAndUpdate(
        { _id: userId, workspaceId: req.user!.workspaceId },
        { role },
        { new: true }
      ).select('-passwordHash');

      if (!member) {
        res.status(404).json({ error: 'Member not found in your workspace' });
        return;
      }

      res.json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   POST /api/workspace/invite
// @desc    Create placeholder user record (Workspace scoped)
// @access  ADMIN
router.post(
  '/invite',
  requireAuth,
  requireWorkspaceScope,
  requireRole('ADMIN'),
  async (req, res): Promise<void> => {
    try {
      const parsed = inviteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }

      const { name, email, role } = parsed.data;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: 'User with this email already exists' });
        return;
      }

      // Generate a temporary password (simulate invite)
      const tempPassword = 'TempPassword123!';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(tempPassword, salt);

      // Create new user scoped to workspace
      const newUser = await User.create({
        name,
        email,
        passwordHash,
        role,
        workspaceId: req.user!.workspaceId as any
      });

      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        workspaceId: newUser.workspaceId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/workspace/themes
// @desc    Get all themes in the workspace
// @access  ADMIN, ANALYST, VIEWER
router.get(
  '/themes',
  requireAuth,
  requireWorkspaceScope,
  async (req, res): Promise<void> => {
    try {
      const themes = await Theme.find(req.workspaceFilter!);
      res.json(themes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
