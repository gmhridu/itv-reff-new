import crypto from 'crypto';
import { NextRequest } from 'next/server';

interface CSRFTokenEntry {
  token: string;
  createdAt: number;
  used: boolean;
}

class CSRFProtection {
  private tokens = new Map<string, CSRFTokenEntry>();
  private cleanupInterval: NodeJS.Timeout;
  private readonly TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Clean up expired tokens every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.tokens.entries()) {
      if (entry.createdAt + this.TOKEN_EXPIRY < now || entry.used) {
        this.tokens.delete(key);
      }
    }
  }

  private getClientIdentifier(request: NextRequest): string {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    return crypto.createHash('sha256')
      .update(`${ip}_${userAgent}`)
      .digest('hex')
      .substring(0, 16);
  }

  public generateToken(request: NextRequest): string {
    const clientId = this.getClientIdentifier(request);
    const tokenValue = crypto.randomBytes(32).toString('hex');
    const tokenKey = `${clientId}_${tokenValue}`;

    this.tokens.set(tokenKey, {
      token: tokenValue,
      createdAt: Date.now(),
      used: false
    });

    return tokenValue;
  }

  public validateToken(request: NextRequest, token: string): boolean {
    if (!token) {
      return false;
    }

    const clientId = this.getClientIdentifier(request);
    const tokenKey = `${clientId}_${token}`;
    const entry = this.tokens.get(tokenKey);

    if (!entry) {
      return false;
    }

    // Check if token is expired
    if (entry.createdAt + this.TOKEN_EXPIRY < Date.now()) {
      this.tokens.delete(tokenKey);
      return false;
    }

    // Check if token was already used (for one-time use)
    if (entry.used) {
      return false;
    }

    // Mark token as used
    entry.used = true;
    this.tokens.set(tokenKey, entry);

    return true;
  }

  public validateAndConsumeToken(request: NextRequest, token: string): boolean {
    const isValid = this.validateToken(request, token);
    if (isValid) {
      // Token is automatically marked as used in validateToken
      return true;
    }
    return false;
  }

  public destroy() {
    clearInterval(this.cleanupInterval);
    this.tokens.clear();
  }
}

export const csrfProtection = new CSRFProtection();

// Middleware helper for CSRF protection
export function validateCSRF(request: NextRequest): boolean {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  const method = request.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  // Get CSRF token from header or body
  const csrfToken = request.headers.get('x-csrf-token') || 
                   request.headers.get('csrf-token');

  if (!csrfToken) {
    return false;
  }

  return csrfProtection.validateAndConsumeToken(request, csrfToken);
}

// Helper to generate CSRF token for forms
export function generateCSRFToken(request: NextRequest): string {
  return csrfProtection.generateToken(request);
}
