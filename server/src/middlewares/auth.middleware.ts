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

    const token = authHeader.substring(7); // "Bearer " kısmını çıkar

    const payload = verifyToken(token);

    // Request objesine kullanıcı bilgilerini ekle
    req.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      platformRole: payload.role as 'USER' | 'ADMIN',
      status: 'ACTIVE' as const
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
  }
};
