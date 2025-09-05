import { NextRequest, NextResponse } from "next/server";
import {
  notificationService,
  NotificationType,
  NotificationSeverity,
} from "@/lib/admin/notification-service";
import { ApiResponse } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy =
      (searchParams.get("sortBy") as "createdAt" | "readAt") || "createdAt";
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    // Parse filter parameters
    const filters: any = {};

    const type = searchParams.get("type") as NotificationType;
    if (type && Object.values(NotificationType).includes(type)) {
      filters.type = type;
    }

    const severity = searchParams.get("severity") as NotificationSeverity;
    if (severity && Object.values(NotificationSeverity).includes(severity)) {
      filters.severity = severity;
    }

    const targetType = searchParams.get("targetType");
    if (targetType) {
      filters.targetType = targetType;
    }

    const targetId = searchParams.get("targetId");
    if (targetId) {
      filters.targetId = targetId;
    }

    const isReadParam = searchParams.get("isRead");
    if (isReadParam !== null) {
      filters.isRead = isReadParam === "true";
    }

    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");

    if (dateFromParam) {
      const dateFrom = new Date(dateFromParam);
      if (!isNaN(dateFrom.getTime())) {
        filters.dateFrom = dateFrom;
      }
    }

    if (dateToParam) {
      const dateTo = new Date(dateToParam);
      if (!isNaN(dateTo.getTime())) {
        filters.dateTo = dateTo;
      }
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pagination parameters",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Get notifications
    const notifications = await notificationService.getNotifications(
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    );

    return NextResponse.json(
      {
        success: true,
        data: notifications,
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Notifications API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch notifications",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
      title,
      message,
      severity,
      targetType,
      targetId,
      actionUrl,
      metadata,
    } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Type, title, and message are required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate type
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid notification type",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Validate severity if provided
    if (severity && !Object.values(NotificationSeverity).includes(severity)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid notification severity",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Create notification
    const notification = await notificationService.createNotification(
      type,
      title,
      message,
      {
        severity,
        targetType,
        targetId,
        actionUrl,
        metadata,
      },
    );

    return NextResponse.json(
      {
        success: true,
        data: notification,
        message: "Notification created successfully",
      } as ApiResponse,
      { status: 201 },
    );
  } catch (error) {
    console.error("Create notification API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create notification",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const body = await req.json();

    if (action === "mark-read") {
      const { notificationIds } = body;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          {
            success: false,
            error: "Notification IDs array is required",
          } as ApiResponse,
          { status: 400 },
        );
      }

      const updatedCount =
        await notificationService.markMultipleAsRead(notificationIds);

      return NextResponse.json(
        {
          success: true,
          data: { updatedCount },
          message: `Marked ${updatedCount} notifications as read`,
        } as ApiResponse,
        { status: 200 },
      );
    }

    if (action === "mark-all-read") {
      const { targetType, targetId } = body;

      const updatedCount = await notificationService.markAllAsReadForTarget(
        targetType,
        targetId,
      );

      return NextResponse.json(
        {
          success: true,
          data: { updatedCount },
          message: `Marked ${updatedCount} notifications as read`,
        } as ApiResponse,
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      } as ApiResponse,
      { status: 400 },
    );
  } catch (error) {
    console.error("Update notifications API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update notifications",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "cleanup") {
      const body = await req.json();
      const { retentionDays = 90 } = body;

      if (typeof retentionDays !== "number" || retentionDays < 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid retention days",
          } as ApiResponse,
          { status: 400 },
        );
      }

      const deletedCount =
        await notificationService.cleanupOldNotifications(retentionDays);

      return NextResponse.json(
        {
          success: true,
          data: { deletedCount },
          message: `Deleted ${deletedCount} old notifications`,
        } as ApiResponse,
        { status: 200 },
      );
    }

    if (action === "bulk-delete") {
      const body = await req.json();
      const { notificationIds } = body;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          {
            success: false,
            error: "Notification IDs array is required",
          } as ApiResponse,
          { status: 400 },
        );
      }

      const deletedCount =
        await notificationService.deleteMultipleNotifications(notificationIds);

      return NextResponse.json(
        {
          success: true,
          data: { deletedCount },
          message: `Deleted ${deletedCount} notifications`,
        } as ApiResponse,
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      } as ApiResponse,
      { status: 400 },
    );
  } catch (error) {
    console.error("Delete notifications API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete notifications",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
