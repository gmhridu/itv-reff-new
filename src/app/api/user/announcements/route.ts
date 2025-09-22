import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiResponse } from "@/types/admin";
import { authMiddleware } from "@/lib/api/api-auth";

// Alias authMiddleware as withAuth to maintain compatibility with existing code
const withAuth = authMiddleware;

// GET /api/user/announcements - Get unread announcements for the current user
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user's current position info
    const userWithPosition = await db.user.findUnique({
      where: { id: user.id },
      include: {
        currentPosition: true,
      },
    });

    if (!userWithPosition) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Build targeting criteria
    const targetingWhere: any[] = [
      // Announcements targeting all users
      { targetType: "all" },
      // Announcements targeting this specific user
      {
        targetType: "specific",
        targetId: {
          contains: user.id,
        },
      },
    ];

    // If user has a position, include level-based targeting
    if (userWithPosition.currentPositionId) {
      targetingWhere.push({
        targetType: "level",
        targetId: userWithPosition.currentPositionId,
      });
    }

    // Get all active announcements that match targeting criteria and user hasn't read
    const unreadAnnouncements = await db.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        AND: [
          {
            OR: targetingWhere,
          },
          {
            NOT: {
              userAnnouncements: {
                some: {
                  userId: user.id,
                  isRead: true,
                },
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        announcements: unreadAnnouncements,
        count: unreadAnnouncements.length,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching user announcements:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch announcements",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
