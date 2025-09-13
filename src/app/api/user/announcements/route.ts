import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiResponse } from "@/types/admin";
import { authMiddleware } from "@/lib/api/api-auth";

// Alias authMiddleware as withAuth to maintain compatibility with existing code
const withAuth = authMiddleware;

// GET /api/user/announcements/unread - Get unread announcements for the current user
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all active announcements that the user hasn't seen yet
    const unreadAnnouncements = await db.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
        NOT: {
          userAnnouncements: {
            some: {
              userId: user.id,
              isRead: true,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
      { status: 500 }
    );
  }
}

// POST /api/user/announcements/[id]/read - Mark an announcement as read
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate user
    const user = await withAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const announcementId = params.id;
    if (!announcementId) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if the announcement exists
    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Create or update user announcement record
    let userAnnouncement = await db.userAnnouncement.findUnique({
      where: {
        userId_announcementId: {
          userId: user.id,
          announcementId: announcementId,
        },
      },
    });

    if (!userAnnouncement) {
      userAnnouncement = await db.userAnnouncement.create({
        data: {
          userId: user.id,
          announcementId: announcementId,
          isRead: true,
          readAt: new Date(),
        },
      });
    } else if (!userAnnouncement.isRead) {
      userAnnouncement = await db.userAnnouncement.update({
        where: {
          id: userAnnouncement.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: userAnnouncement,
      message: "Announcement marked as read",
    } as ApiResponse);
  } catch (error) {
    console.error("Error marking announcement as read:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to mark announcement as read",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}