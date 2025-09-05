import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now && (!entry.blockUntil || entry.blockUntil < now)) {
        this.store.delete(key);
      }
    }
  }

  private getClientIdentifier(request: NextRequest): string {
    // Use multiple identifiers for better security
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Create a hash of IP + User Agent for privacy
    return `${ip.split(',')[0]}_${userAgent.substring(0, 50)}`;
  }

  public checkRateLimit(
    request: NextRequest, 
    options: {
      windowMs: number;
      maxAttempts: number;
      blockDurationMs?: number;
      skipSuccessfulRequests?: boolean;
    }
  ): { allowed: boolean; remaining: number; resetTime: number; blocked: boolean } {
    const identifier = this.getClientIdentifier(request);
    const now = Date.now();
    const { windowMs, maxAttempts, blockDurationMs = 15 * 60 * 1000 } = options;

    let entry = this.store.get(identifier);

    // Check if currently blocked
    if (entry?.blocked && entry.blockUntil && entry.blockUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockUntil,
        blocked: true
      };
    }

    // Reset window if expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
        blocked: false
      };
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxAttempts) {
      entry.blocked = true;
      entry.blockUntil = now + blockDurationMs;
      
      this.store.set(identifier, entry);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockUntil,
        blocked: true
      };
    }

    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: maxAttempts - entry.count,
      resetTime: entry.resetTime,
      blocked: false
    };
  }

  public recordSuccess(request: NextRequest, skipReset: boolean = false) {
    if (skipReset) return;
    
    const identifier = this.getClientIdentifier(request);
    const entry = this.store.get(identifier);
    
    if (entry && !entry.blocked) {
      // Reset count on successful authentication
      entry.count = 0;
      this.store.set(identifier, entry);
    }
  }

  public getAttemptCount(request: NextRequest): number {
    const identifier = this.getClientIdentifier(request);
    const entry = this.store.get(identifier);
    return entry?.count || 0;
  }

  public destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
  },
  REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
  },
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
  },
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100,
    blockDurationMs: 15 * 60 * 1000, // 15 minutes block
  }
};
