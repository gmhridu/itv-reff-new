import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { AdminMiddleware } from "@/lib/admin-middleware";
import { ApiResponse } from "@/types/admin";
import { notificationService, NotificationType, NotificationSeverity } from "@/lib/admin/notification-service";

// GET /api/admin/announcements - Get all announcements with pagination
export async function GET(req: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await AdminMiddleware.authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    // Filter by active status if specified
    const isActive = searchParams.get("isActive");
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    // Get announcements with pagination
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
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
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        announcements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching announcements:", error);
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

// POST /api/admin/announcements - Create a new announcement
export async function POST(req: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await AdminMiddleware.authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      message,
      imageUrl,
      targetType = "all",
      targetId,
      scheduleType = "immediate",
      scheduledAt,
      expiresAt,
      isActive = true,
    } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and message are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        imageUrl,
        targetType,
        targetId,
        scheduleType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive,
        admin: {
          connect: {
            id: admin.id,
          },
        },
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

    // If this is an immediate announcement, send notifications to users
    if (scheduleType === "immediate" && isActive) {
      await sendAnnouncementNotifications(announcement);
    }

    return NextResponse.json(
      {
        success: true,
        data: announcement,
        message: "Announcement created successfully",
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create announcement",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// PATCH /api/admin/announcements/:id - Update an announcement
export async function PATCH(req: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await AdminMiddleware.authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      title,
      message,
      imageUrl,
      targetType,
      targetId,
      scheduleType,
      scheduledAt,
      expiresAt,
      isActive,
    } = body;

    // Update announcement
    const announcement = await prisma.announcement.update({
      where: {
        id,
      },
      data: {
        title,
        message,
        imageUrl,
        targetType,
        targetId,
        scheduleType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive,
        updatedAt: new Date(),
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

    // If this is an immediate announcement and is now active, send notifications to users
    if (scheduleType === "immediate" && isActive && announcement.isActive) {
      await sendAnnouncementNotifications(announcement);
    }

    return NextResponse.json(
      {
        success: true,
        data: announcement,
        message: "Announcement updated successfully",
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update announcement",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/admin/announcements/:id - Delete an announcement
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await AdminMiddleware.authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Delete announcement
    await prisma.announcement.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Announcement deleted successfully",
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete announcement",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// Helper function to send announcement notifications to users
async function sendAnnouncementNotifications(announcement: any) {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
      },
    });

    // Create notifications for each user
    const notifications = users.map((user) => ({
      type: NotificationType.SYSTEM_ALERT,
      title: announcement.title,
      message: announcement.message,
      severity: NotificationSeverity.INFO,
      targetType: "USER",
      targetId: user.id,
      actionUrl: "/announcements",
      metadata: announcement.imageUrl
        ? JSON.stringify({ imageUrl: announcement.imageUrl })
        : null,
    }));

    // Create user announcement records
    const userAnnouncements = users.map((user) => ({
      userId: user.id,
      announcementId: announcement.id,
      isRead: false, // Initially unread
    }));

    // Create notifications in batches
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      await prisma.systemNotification.createMany({
        data: batch,
      });
    }

    // Create user announcement records in batches
    for (let i = 0; i < userAnnouncements.length; i += 100) {
      const batch = userAnnouncements.slice(i, i + 100);
      await prisma.userAnnouncement.createMany({
        data: batch,
      });
    }
  } catch (error) {
    console.error("Error sending announcement notifications:", error);
  }
}