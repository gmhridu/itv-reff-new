import { NextRequest, NextResponse } from "next/server";
import { getUserFromServer } from "@/lib/api/auth";
import { NotificationService } from "@/lib/notification-service";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  let response: NextResponse;

  try {
    // Get current user
    const user = await getUserFromServer();
    if (!user) {
      response = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    const body = await request.json();
    const { title, message, type, severity } = body;

    // Validate required fields
    if (!title || !message) {
      response = NextResponse.json(
        { success: false, error: "Title and message are required" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Create test notification
    const notification = await NotificationService.createNotification(
      {
        type: type || "USER_ACTION",
        title,
        message,
        severity: severity || "INFO",
        actionUrl: "/test-notifications",
        metadata: {
          isTest: true,
          createdBy: user.id,
          timestamp: new Date().toISOString(),
        },
      },
      user.id,
    );

    response = NextResponse.json({
      success: true,
      message: "Test notification created successfully",
      data: {
        notificationId: notification.id,
        userId: user.id,
        title,
        message,
        type: type || "USER_ACTION",
        severity: severity || "INFO",
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Test notification creation error:", error);
    response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
