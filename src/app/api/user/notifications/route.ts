import { NextRequest, NextResponse } from "next/server";
import { getUserFromServer } from "@/lib/api/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromServer();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      OR: [
        { targetType: "USER", targetId: user.id },
        { targetType: "ALL", targetId: null },
      ],
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    // Get notifications
    const [notifications, totalCount] = await Promise.all([
      db.systemNotification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.systemNotification.count({ where: whereClause }),
    ]);

    // Get unread count
    const unreadCount = await db.systemNotification.count({
      where: {
        ...whereClause,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch notifications",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromServer();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "mark-read") {
      const body = await req.json();
      const { notificationId } = body;

      if (!notificationId) {
        return NextResponse.json(
          {
            success: false,
            error: "Notification ID is required",
          },
          { status: 400 },
        );
      }

      // Update notification
      const updatedNotification = await db.systemNotification.updateMany({
        where: {
          id: notificationId,
          OR: [
            { targetType: "USER", targetId: user.id },
            { targetType: "ALL" },
          ],
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      if (updatedNotification.count === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Notification not found or access denied",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
      });
    }

    if (action === "mark-all-read") {
      // Mark all notifications as read for this user
      await db.systemNotification.updateMany({
        where: {
          OR: [
            { targetType: "USER", targetId: user.id },
            { targetType: "ALL" },
          ],
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update notification",
      },
      { status: 500 },
    );
  }
}
