import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

export class JWTUtil {
  static generateTokens(payload: JWTPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    
    return { accessToken, refreshToken };
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  static generateAccessTokenFromRefreshToken(refreshToken: string): string {
    try {
      const payload = this.verifyToken(refreshToken);
      return jwt.sign(
        { userId: payload.userId, email: payload.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}