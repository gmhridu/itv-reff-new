import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AdminMiddleware } from "@/lib/admin-middleware";
import { ApiResponse } from "@/types/admin";
import {
  notificationService,
  NotificationType,
  NotificationSeverity,
} from "@/lib/admin/notification-service";

// GET /api/admin/announcements/[id] - Get a specific announcement
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Authenticate admin user
    const admin = await AdminMiddleware.authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement ID is required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Get announcement with admin details and user announcement stats
    const announcement = await db.announcement.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        userAnnouncements: {
          select: {
            id: true,
            isRead: true,
            readAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            userAnnouncements: true,
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement not found",
        } as ApiResponse,
        { status: 404 },
      );
    }

    // Calculate read statistics
    const totalRecipients = announcement.userAnnouncements.length;
    const readCount = announcement.userAnnouncements.filter(
      (ua) => ua.isRead,
    ).length;
    const unreadCount = totalRecipients - readCount;

    const responseData = {
      ...announcement,
      statistics: {
        totalRecipients,
        readCount,
        unreadCount,
        readPercentage:
          totalRecipients > 0
            ? Math.round((readCount / totalRecipients) * 100)
            : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch announcement",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// PATCH /api/admin/announcements/[id] - Update an announcement
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Authenticate admin user
    const admin = await AdminMiddleware.authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement ID is required",
        } as ApiResponse,
        { status: 400 },
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
      customOffer,
    } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and message are required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Check if announcement exists
    const existingAnnouncement = await db.announcement.findUnique({
      where: { id },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement not found",
        } as ApiResponse,
        { status: 404 },
      );
    }

    // Prepare update data
    const updateData: any = {
      title,
      message,
      imageUrl,
      targetType: targetType || "all",
      targetId,
      scheduleType: scheduleType || "immediate",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date(),
    };

    // Handle custom offer data
    if (customOffer) {
      updateData.metadata = JSON.stringify({
        customOffer,
        offerType: customOffer.type,
        offerValue: customOffer.value,
        offerExpiry: customOffer.expiry,
        offerCode: customOffer.code,
      });
    }

    // Update announcement
    const announcement = await db.announcement.update({
      where: { id },
      data: updateData,
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
      await sendAnnouncementNotifications(announcement, targetType, targetId);
    }

    return NextResponse.json(
      {
        success: true,
        data: announcement,
        message: "Announcement updated successfully",
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update announcement",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// DELETE /api/admin/announcements/[id] - Delete an announcement
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Authenticate admin user
    const admin = await AdminMiddleware.authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement ID is required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Check if announcement exists
    const existingAnnouncement = await db.announcement.findUnique({
      where: { id },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement not found",
        } as ApiResponse,
        { status: 404 },
      );
    }

    // Delete announcement (this will cascade delete userAnnouncements due to schema)
    await db.announcement.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Announcement deleted successfully",
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete announcement",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// Helper function to send announcement notifications to users and create offers
async function sendAnnouncementNotifications(
  announcement: any,
  targetType?: string,
  targetId?: string,
) {
  try {
    let targetUsers: { id: string }[] = [];

    // Get target users based on targetType
    if (targetType === "specific" && targetId) {
      // Send to specific user(s)
      const userIds = targetId.split(",").map((id) => id.trim());
      targetUsers = await db.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
        },
      });
    } else if (targetType === "level" && targetId) {
      // Send to users with specific position level
      targetUsers = await db.user.findMany({
        where: {
          currentPositionId: targetId,
        },
        select: {
          id: true,
        },
      });
    } else {
      // Send to all users (default)
      targetUsers = await db.user.findMany({
        select: {
          id: true,
        },
      });
    }

    if (targetUsers.length === 0) {
      console.log("No target users found for announcement");
      return;
    }

    // Parse custom offer from announcement metadata
    let customOffer: any = null;
    if (announcement.metadata) {
      try {
        const metadata = JSON.parse(announcement.metadata);
        customOffer = metadata.customOffer;
      } catch (error) {
        console.error("Error parsing announcement metadata:", error);
      }
    }

    // Create notifications for each user
    const notifications = targetUsers.map((user) => ({
      type: NotificationType.SYSTEM_ALERT,
      title: announcement.title,
      message: announcement.message,
      severity: NotificationSeverity.INFO,
      targetType: "USER" as const,
      targetId: user.id,
      actionUrl: "/announcements",
      metadata:
        announcement.imageUrl || announcement.metadata
          ? JSON.stringify({
              imageUrl: announcement.imageUrl,
              customOffer: customOffer,
            })
          : null,
    }));

    // Create user announcement records
    const userAnnouncements = targetUsers.map((user) => ({
      userId: user.id,
      announcementId: announcement.id,
      isRead: false, // Initially unread
    }));

    // Create user offers if custom offer exists
    const userOffers: Array<{
      userId: string;
      announcementId: string;
      offerType: string;
      offerValue: string;
      offerCode?: string | null;
      description?: string | null;
      expiresAt?: Date | null;
      scheduledAt?: Date | null;
    }> = [];

    if (customOffer) {
      for (const user of targetUsers) {
        userOffers.push({
          userId: user.id,
          announcementId: announcement.id,
          offerType: customOffer.type,
          offerValue: customOffer.value,
          offerCode: customOffer.code || null,
          description: customOffer.description || null,
          expiresAt: customOffer.expiry ? new Date(customOffer.expiry) : null,
          scheduledAt: announcement.scheduledAt || null,
        });
      }
    }

    // Create notifications in batches
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      await db.systemNotification.createMany({
        data: batch,
      });
    }

    // Create user announcement records in batches
    for (let i = 0; i < userAnnouncements.length; i += 100) {
      const batch = userAnnouncements.slice(i, i + 100);
      try {
        await db.userAnnouncement.createMany({
          data: batch,
          skipDuplicates: true, // Avoid duplicate entries
        });
      } catch (error) {
        console.error("Error creating user announcement batch:", error);
      }
    }

    // Create user offers in batches if they exist
    if (userOffers.length > 0) {
      for (let i = 0; i < userOffers.length; i += 100) {
        const batch = userOffers.slice(i, i + 100);
        try {
          await (db as any).userOffer.createMany({
            data: batch,
            skipDuplicates: true,
          });
        } catch (error) {
          console.error("Error creating user offers batch:", error);
        }
      }
      console.log(`Created ${userOffers.length} user offers`);
    }

    console.log(`Sent announcement to ${targetUsers.length} users`);
  } catch (error) {
    console.error("Error sending announcement notifications:", error);
  }
}
