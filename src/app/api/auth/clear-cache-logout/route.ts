import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db as prisma } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate the user
    const user = await authMiddleware(request);
    if (!user) {
      response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Log the cache clear and logout activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: "cache_cleared_logout",
        description: "User cleared cache and logged out",
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          reason: "user_requested_cache_clear",
        }),
      },
    });

    // Clear any cached dashboard data for this user
    try {
      await prisma.dashboardCache.deleteMany({
        where: {
          OR: [
            { cacheKey: { contains: user.id } },
            { cacheKey: { contains: `user_${user.id}` } },
          ],
        },
      });
    } catch (cacheError) {
      console.warn("Failed to clear dashboard cache:", cacheError);
      // Don't fail the request if cache clearing fails
    }

    // Create the logout response
    response = NextResponse.json({
      success: true,
      message: "Cache cleared and logged out successfully",
    });

    // Clear authentication cookies
    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    // Add cache control headers to prevent caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Clear cache and logout error:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
