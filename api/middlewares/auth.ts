import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '../utils/jwt';
import { JWTPayload } from '../types/auth.types';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'No token provided'
    });
  }

  try {
    const payload = JWTUtil.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
      message: 'Token verification failed'
    });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const payload = JWTUtil.verifyToken(token);
      req.user = payload;
    } catch (error) {
      // Token is invalid, but we don't block the request
      // Just don't set req.user
    }
  }

  next();
};