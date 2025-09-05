import { NextRequest } from "next/server";
import { SecureTokenManager } from "@/lib/token-manager";
import { getUserById, getAdminById } from "@/lib/api/auth";

// API authentication middleware replacement
export async function authMiddleware(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    let token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      token = request.cookies.get("access_token")?.value;
    }

    if (!token) {
      return null;
    }

    // Verify access token
    const payload = SecureTokenManager.verifyAccessToken(token);
    if (!payload) {
      return null;
    }

    // Get user from database
    const user = await getUserById(payload.userId);
    return user;
  } catch (error) {
    console.error("Auth middleware error:", error);
    return null;
  }
}

// Admin-specific authentication middleware
export async function adminAuthMiddleware(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    let token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      token = request.cookies.get("access_token")?.value;
    }

    if (!token) {
      return null;
    }

    // Verify access token
    const payload = SecureTokenManager.verifyAccessToken(token);
    if (!payload) {
      return null;
    }

    // Get admin from database
    const admin = await getAdminById(payload.userId);
    return admin;
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return null;
  }
}

// Security middleware replacement for registration validation
export function validateRegistrationRequest(request: NextRequest) {
  // Basic validation - can be enhanced as needed
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return { valid: false, response: null };
  }
  return { valid: true, response: null };
}

// Video watch request validation
export function validateVideoWatchRequest(request: NextRequest) {
  // Basic validation - can be enhanced as needed
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return false;
  }
  return true;
}
