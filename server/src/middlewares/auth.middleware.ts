import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    platformRole: string;
    username: string;
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
      userId: payload.sub,
      platformRole: payload.role,
      username: payload.username
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
  }
};
