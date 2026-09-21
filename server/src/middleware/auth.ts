import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User, IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    // Token via query param is accepted ONLY for the SSE stream endpoint
    // (EventSource cannot set custom headers). Everywhere else it must come
    // from the Authorization header so tokens don't leak into URLs/logs.
    const isSseStream = typeof req.originalUrl === 'string' && req.originalUrl.includes('/notifications/stream');
    const queryToken = isSseStream && typeof req.query.token === 'string' ? req.query.token : null;
    const token = header && header.startsWith('Bearer ')
      ? header.split(' ')[1]
      : queryToken;

    if (!token) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }
    next();
  };
};
