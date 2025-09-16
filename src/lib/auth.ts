import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface AuthSession {
  user?: AuthUser;
}

export const authOptions = {
  // Mock auth options - replace with actual implementation
};

// Get user ID from session/cookies
async function getCurrentUserId(
  isAdmin: boolean = false,
): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    // Check for session cookies (adjust cookie names based on your auth implementation)
    const sessionToken =
      cookieStore.get("session-token")?.value ||
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value ||
      cookieStore.get("auth-token")?.value;

    if (sessionToken) {
      // In a real app, you would decode JWT or validate session token
      // For now, we'll extract user ID from token if it's a simple format
      try {
        const decoded = JSON.parse(atob(sessionToken));
        const userId = decoded.userId || decoded.sub || decoded.id;
        if (userId && typeof userId === "string") {
          return userId;
        }
      } catch (error) {
        // Token is not simple JSON, might be JWT - you'd need to decode it properly
        console.log(
          "Session token found but cannot decode:",
          sessionToken.substring(0, 20) + "...",
          error,
        );
      }
    }

    // Check for user-specific cookies
    const userIdCookie = cookieStore.get("user-id")?.value;
    if (userIdCookie && typeof userIdCookie === "string") {
      return userIdCookie;
    }

    // Development fallback: Use environment variable (only for development)
    if (process.env.NODE_ENV === "development") {
      const devUserId = process.env.DEV_USER_ID;
      if (devUserId) {
        console.warn("Using DEV_USER_ID for development:", devUserId);
        return devUserId;
      }
    }

    // No valid session found
    return null;
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
}

// Mock function to get server session
export async function getServerSession(
  options?: any,
): Promise<AuthSession | null> {
  try {
    // In a real application, this would validate JWT tokens or session cookies
    // For development, we need to determine if this is a user or admin request

    // Check if this is an admin route by examining the request URL or context
    // For now, we'll use a simple heuristic based on whether we're in an admin context
    const isAdminContext = options?.adminContext || false;

    if (isAdminContext) {
      // Get current admin user ID
      const currentUserId = await getCurrentUserId(true);

      let adminUser;
      if (currentUserId) {
        adminUser = await prisma.adminUser.findUnique({
          where: { id: currentUserId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        });
      }

      // Fallback to first admin if no specific user found
      if (!adminUser) {
        adminUser = await prisma.adminUser.findFirst({
          where: {
            role: {
              in: ["ADMIN", "SUPER_ADMIN"],
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        });
      }

      if (!adminUser) {
        console.warn(
          "No admin users found in database. Please create an admin user.",
        );
        return null;
      }

      return {
        user: {
          id: adminUser.id,
          name: adminUser.name || undefined,
          email: adminUser.email || undefined,
          phone: adminUser.phone || undefined,
          role: adminUser.role,
        },
      };
    } else {
      // Get current user ID
      const currentUserId = await getCurrentUserId(false);
      console.log("Getting user session for user ID:", currentUserId);

      // If no valid user ID found, return null (no valid session)
      if (!currentUserId) {
        console.log("No valid session token found");
        return null;
      }

      let regularUser;
      if (currentUserId) {
        regularUser = await prisma.user.findUnique({
          where: { id: currentUserId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        });
        console.log("Found user by ID:", regularUser);
      }

      // If no user found with the session ID, return null (invalid session)
      if (!regularUser) {
        console.log("No user found for session ID:", currentUserId);
        return null;
      }

      return {
        user: {
          id: regularUser.id,
          name: regularUser.name || undefined,
          email: regularUser.email || undefined,
          phone: regularUser.phone || undefined,
          role: "USER",
        },
      };
    }
  } catch (error) {
    console.error("Error in getServerSession:", error);
    return null;
  }
}

// Admin-specific session function
export async function getAdminSession(): Promise<AuthSession | null> {
  return getServerSession({ adminContext: true });
}

// User-specific session function
export async function getUserSession(): Promise<AuthSession | null> {
  return getServerSession({ adminContext: false });
}

// Export for compatibility with next-auth patterns
export { getServerSession as default };
