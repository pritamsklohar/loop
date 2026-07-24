import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'ADMIN' | 'ANALYST' | 'VIEWER';
        workspaceId: string;
      };
      workspaceFilter?: {
        workspaceId: string;
      };
    }
  }
}

interface JWTPayload {
  id: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  workspaceId: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireWorkspaceScope = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.workspaceId) {
    res.status(401).json({ error: 'Unauthorized: No workspace scope found.' });
    return;
  }
  req.workspaceFilter = { workspaceId: req.user.workspaceId };
  next();
};

export const requireRole = (...allowedRoles: ('ADMIN' | 'ANALYST' | 'VIEWER')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
      return;
    }
    next();
  };
};
