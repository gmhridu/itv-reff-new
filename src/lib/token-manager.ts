import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db';
import { UserStatus } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error('JWT_SECRET environment variable is required');
})();

const REFRESH_SECRET = process.env.REFRESH_SECRET || (() => {
  throw new Error('REFRESH_SECRET environment variable is required');
})();

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

// In-memory token blacklist (in production, use Redis or database)
class TokenBlacklist {
  private blacklistedTokens = new Set<string>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired tokens every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  private cleanup() {
    // Remove tokens that would have expired anyway
    const now = Math.floor(Date.now() / 1000);

    for (const token of this.blacklistedTokens) {
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.exp && decoded.exp < now) {
          this.blacklistedTokens.delete(token);
        }
      } catch {
        // Invalid token, remove it
        this.blacklistedTokens.delete(token);
      }
    }
  }

  public blacklist(token: string) {
    this.blacklistedTokens.add(token);
  }

  public isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  public blacklistSession(sessionId: string) {
    // In a real implementation, you'd query the database for all tokens with this sessionId
    // For now, we'll mark the sessionId as blacklisted
    this.blacklistedTokens.add(`session:${sessionId}`);
  }

  public isSessionBlacklisted(sessionId: string): boolean {
    return this.blacklistedTokens.has(`session:${sessionId}`);
  }

  public destroy() {
    clearInterval(this.cleanupInterval);
    this.blacklistedTokens.clear();
  }
}

export const tokenBlacklist = new TokenBlacklist();

export class SecureTokenManager {
  private static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public static generateTokenPair(userId: string, email: string): TokenPair {
    const sessionId = this.generateSessionId();

    const accessTokenPayload: JWTPayload = {
      userId,
      email,
      sessionId,
      type: 'access'
    };

    const refreshTokenPayload: JWTPayload = {
      userId,
      email,
      sessionId,
      type: 'refresh'
    };

    const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
      expiresIn: '15m', // Short-lived access token
      issuer: 'videotask-app',
      audience: 'videotask-users'
    });

    const refreshToken = jwt.sign(refreshTokenPayload, REFRESH_SECRET, {
      expiresIn: '7d', // Longer-lived refresh token
      issuer: 'videotask-app',
      audience: 'videotask-users'
    });

    return {
      accessToken,
      refreshToken,
      sessionId
    };
  }

  public static verifyAccessToken(token: string): JWTPayload | null {
    try {
      // Check if token is blacklisted
      if (tokenBlacklist.isBlacklisted(token)) {
        return null;
      }

      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: 'videotask-app',
        audience: 'videotask-users'
      }) as JWTPayload;

      // Check if session is blacklisted
      if (tokenBlacklist.isSessionBlacklisted(payload.sessionId)) {
        return null;
      }

      // Verify token type
      if (payload.type !== 'access') {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  public static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      // Check if token is blacklisted
      if (tokenBlacklist.isBlacklisted(token)) {
        return null;
      }

      const payload = jwt.verify(token, REFRESH_SECRET, {
        issuer: 'videotask-app',
        audience: 'videotask-users'
      }) as JWTPayload;

      // Check if session is blacklisted
      if (tokenBlacklist.isSessionBlacklisted(payload.sessionId)) {
        return null;
      }

      // Verify token type
      if (payload.type !== 'refresh') {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  public static refreshTokens(refreshToken: string): TokenPair | null {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    // Blacklist the old refresh token
    tokenBlacklist.blacklist(refreshToken);

    // Generate new token pair
    return this.generateTokenPair(payload.userId, payload.email);
  }

  public static revokeToken(token: string) {
    tokenBlacklist.blacklist(token);
  }

  public static revokeSession(sessionId: string) {
    tokenBlacklist.blacklistSession(sessionId);
  }

  public static revokeAllUserSessions(userId: string) {
    // In a real implementation, you'd query the database for all active sessions
    // and blacklist them. For now, we'll implement a basic version.
    tokenBlacklist.blacklistSession(`user:${userId}`);
  }

  public static async isUserBanned(userId: string): Promise<boolean> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { status: true }
      });
      return user?.status === UserStatus.BANNED;
    } catch (error) {
      console.error('Error checking user ban status:', error);
      return false;
    }
  }
}

// Legacy compatibility functions
export function generateToken(payload: { userId: string; email: string }): string {
  const tokenPair = SecureTokenManager.generateTokenPair(payload.userId, payload.email);
  return tokenPair.accessToken;
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  const payload = SecureTokenManager.verifyAccessToken(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email
  };
}
