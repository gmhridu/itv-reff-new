import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";

export interface AdminTokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
}

// Cache for admin verification to avoid repeated DB calls
const adminCache = new Map<string, { admin: AdminUser; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class AdminMiddleware {
  private static jwtSecret: string | null = null;

  private static getJwtSecret(): string {
    if (!this.jwtSecret) {
      this.jwtSecret = process.env.JWT_SECRET ?? null;
      if (!this.jwtSecret) {
        throw new Error("JWT_SECRET environment variable is required");
      }
    }
    return this.jwtSecret;
  }

  /**
   * Verify JWT token and extract payload
   */
  static async verifyToken(token: string): Promise<AdminTokenPayload | null> {
    try {
      const secret = new TextEncoder().encode(this.getJwtSecret());
      const { payload } = await jwtVerify(token, secret, {
        issuer: "videotask-app",
        audience: "videotask-users",
      });

      // Validate token structure
      if (
        !payload.userId ||
        !payload.email ||
        !payload.sessionId ||
        payload.type !== "access"
      ) {
        console.error("Invalid token payload structure");
        return null;
      }

      return payload as unknown as AdminTokenPayload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }

  /**
   * Get admin user from database with caching
   */
  static async getAdminUser(userId: string): Promise<AdminUser | null> {
    try {
      // Check cache first
      const cached = adminCache.get(userId);
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.admin;
      }

      // Query database
      const admin = await db.adminUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (!admin) {
        // Remove from cache if not found
        adminCache.delete(userId);
        return null;
      }

      // Cache the result
      adminCache.set(userId, {
        admin: admin as AdminUser,
        timestamp: now,
      });

      return admin as AdminUser;
    } catch (error) {
      console.error("Database error in getAdminUser:", error);
      return null;
    }
  }

  /**
   * Extract token from request (header or cookie)
   */
  static getTokenFromRequest(request: NextRequest): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.replace("Bearer ", "");
    }

    // Fall back to cookie
    return request.cookies.get("access_token")?.value || null;
  }

  /**
   * Full admin authentication check
   */
  static async authenticateAdmin(
    request: NextRequest
  ): Promise<AdminUser | null> {
    try {
      // Get token from request
      const token = this.getTokenFromRequest(request);
      if (!token) {
        return null;
      }

      // Verify token
      const payload = await this.verifyToken(token);
      if (!payload) {
        return null;
      }

      // Get admin user
      const admin = await this.getAdminUser(payload.userId);
      return admin;
    } catch (error) {
      console.error("Admin authentication error:", error);
      return null;
    }
  }

  /**
   * Check if admin has required role
   */
  static hasRequiredRole(
    admin: AdminUser,
    requiredRole?: "ADMIN" | "SUPER_ADMIN"
  ): boolean {
    if (!requiredRole) {
      return true; // No specific role required
    }

    // SUPER_ADMIN has access to everything
    if (admin.role === "SUPER_ADMIN") {
      return true;
    }

    // Check exact role match
    return admin.role === requiredRole;
  }

  /**
   * Check if the current user is a super admin
   */
  static isSuperAdmin(admin: AdminUser | null): boolean {
    return admin?.role === "SUPER_ADMIN" || false;
  }

  /**
   * Check if the current user is any admin
   */
  static isAdmin(admin: AdminUser | null): boolean {
    return admin?.role === "ADMIN" || admin?.role === "SUPER_ADMIN" || false;
  }

  /**
   * Clear cache for a specific user (useful after logout)
   */
  static clearUserCache(userId: string): void {
    adminCache.delete(userId);
  }

  /**
   * Clear entire cache (useful for maintenance)
   */
  static clearAllCache(): void {
    adminCache.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: adminCache.size,
      entries: Array.from(adminCache.keys()),
    };
  }
}

// Utility functions for easy use
export const verifyAdminToken = AdminMiddleware.verifyToken.bind(AdminMiddleware);
export const getAdminFromRequest = AdminMiddleware.authenticateAdmin.bind(AdminMiddleware);
export const hasAdminRole = AdminMiddleware.hasRequiredRole.bind(AdminMiddleware);
export const isSuperAdmin = AdminMiddleware.isSuperAdmin.bind(AdminMiddleware);
export const isAdmin = AdminMiddleware.isAdmin.bind(AdminMiddleware);
