import { NextRequest } from 'next/server';

// Device fingerprinting utilities
export function generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';

  // Simple fingerprint based on headers
  const fingerprintString = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;

  // Create a simple hash (in production, use a proper hashing algorithm)
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

// IP address utilities
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  );
}

// Rate limiting utilities
interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;

  let data = rateLimitStore.get(key);

  if (!data || now > data.resetTime) {
    // Create new rate limit entry
    data = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(key, data);

    // Clean up expired entries
    setTimeout(() => {
      rateLimitStore.delete(key);
    }, windowMs);

    return { allowed: true, remaining: maxRequests - 1, resetTime: data.resetTime };
  }

  if (data.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: data.resetTime };
  }

  data.count++;
  return {
    allowed: true,
    remaining: maxRequests - data.count,
    resetTime: data.resetTime
  };
}

// Anti-cheat utilities
export function validateVideoWatch(
  reportedDuration: number,
  videoDuration: number,
  userInteractions: Array<{ timestamp: number; [key: string]: any }>
): { valid: boolean; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let confidence = 1.0;

  // Check minimum watch time (80% of video duration)
  const minimumWatchTime = videoDuration * 0.8;
  if (reportedDuration < minimumWatchTime) {
    reasons.push('Video not watched long enough');
    confidence *= 0.3;
  }

  // Check for suspicious patterns (e.g., exact duration matches)
  if (Math.abs(reportedDuration - videoDuration) < 1) {
    reasons.push('Exact duration match - possible automation');
    confidence *= 0.7;
  }

  // Check user interaction patterns
  if (userInteractions.length === 0) {
    reasons.push('No user interactions detected');
    confidence *= 0.5;
  }

  // Check for consistent interaction timing (possible bot)
  if (userInteractions.length > 1) {
    const intervals: number[] = [];
    for (let i = 1; i < userInteractions.length; i++) {
      intervals.push(userInteractions[i].timestamp - userInteractions[i - 1].timestamp);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;

    if (variance < 100) { // Low variance suggests bot-like behavior
      reasons.push('Suspiciously consistent interaction timing');
      confidence *= 0.6;
    }
  }

  return {
    valid: confidence > 0.5,
    confidence,
    reasons
  };
}

// Multiple account detection
export function detectMultipleAccounts(
  currentIP: string,
  currentDevice: string,
  existingAccounts: Array<{ ip: string; device: string; createdAt: Date }>
): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check for multiple accounts from same IP
  const sameIPAccounts = existingAccounts.filter(account => account.ip === currentIP);
  if (sameIPAccounts.length >= 3) {
    reasons.push(`Multiple accounts (${sameIPAccounts.length}) from same IP`);
  }

  // Check for multiple accounts from same device
  const sameDeviceAccounts = existingAccounts.filter(account => account.device === currentDevice);
  if (sameDeviceAccounts.length >= 2) {
    reasons.push(`Multiple accounts (${sameDeviceAccounts.length}) from same device`);
  }

  // Check for rapid account creation from same IP
  const recentAccounts = sameIPAccounts.filter(account => {
    const timeDiff = Date.now() - account.createdAt.getTime();
    return timeDiff < 24 * 60 * 60 * 1000; // 24 hours
  });

  if (recentAccounts.length >= 2) {
    reasons.push(`Rapid account creation (${recentAccounts.length} in 24 hours)`);
  }

  return {
    suspicious: reasons.length > 0,
    reasons
  };
}

// Input validation and sanitization
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[^\w\s@.-]/g, '') // Keep only alphanumeric, spaces, @, ., -
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Simple phone validation (adjust based on your requirements)
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Security headers
export function getSecurityHeaders() {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
}

// Session security
export function validateSession(request: NextRequest): boolean {
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return false;
  }

  // Check for suspicious patterns in token
  if (token.length < 10 || token.includes(' ')) {
    return false;
  }

  return true;
}

// CAPTCHA verification (placeholder for integration with services like hCaptcha)
export async function verifyCaptcha(token: string, remoteIP: string): Promise<boolean> {
  // In production, integrate with CAPTCHA service
  // For now, return true for demonstration
  return true;
}

// Activity monitoring
export interface UserActivity {
  userId: string;
  action: string;
  timestamp: Date;
  ip: string;
  device: string;
  metadata?: any;
}

const activityLog: UserActivity[] = [];

export function logActivity(activity: UserActivity): void {
  activityLog.push(activity);

  // Keep only last 1000 activities
  if (activityLog.length > 1000) {
    activityLog.splice(0, activityLog.length - 1000);
  }
}

export function getSuspiciousActivities(userId: string): UserActivity[] {
  const userActivities = activityLog.filter(a => a.userId === userId);
  const suspiciousActivities: UserActivity[] = [];

  // Check for rapid successive actions
  for (let i = 1; i < userActivities.length; i++) {
    const timeDiff = userActivities[i].timestamp.getTime() - userActivities[i - 1].timestamp.getTime();

    if (timeDiff < 1000) { // Less than 1 second between actions
      suspiciousActivities.push(userActivities[i]);
    }
  }

  return suspiciousActivities;
}

// Geographic validation (placeholder)
export function validateGeolocation(currentIP: string, lastKnownIP: string): boolean {
  // In production, use IP geolocation service to check for impossible travel
  // For now, return true
  return true;
}
