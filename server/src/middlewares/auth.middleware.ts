import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    platformRole: 'USER' | 'ADMIN';
    status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
    avatarUrl?: string | null;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Token bulunamadı.' });
      return;
    }

    const payload = verifyToken(authHeader.substring(7));

    req.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      platformRole: payload.role as 'USER' | 'ADMIN',
      status: 'ACTIVE' as const,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.platformRole !== 'ADMIN') {
    res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir.' });
    return;
  }
  next();
};
