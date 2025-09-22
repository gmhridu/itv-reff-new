import { NextRequest, NextResponse } from "next/server";
import { adminAuthMiddleware } from "@/lib/api/api-auth";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { db } from "@/lib/db";
import { auditService, AuditAction } from "@/lib/admin/audit-service";
import { notificationService, NotificationType, NotificationSeverity } from "@/lib/admin/notification-service";

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await adminAuthMiddleware(request);

    if (!admin) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Only SUPER_ADMIN can send special commission pushes
    if (admin.role !== "SUPER_ADMIN") {
      const response = NextResponse.json(
        {
          success: false,
          error: "Forbidden - Super Admin access required for special commission pushes",
        },
        { status: 403 },
      );
      return addAPISecurityHeaders(response);
    }

    const body = await request.json();
    const {
      targetType,
      targetUserId,
      targetUserIds,
      amount,
      reason,
      description,
      isBonus = false,
      isUrgent = false,
      notifyUser = true,
      expiresAt,
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Invalid amount - must be greater than 0",
        },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    if (!reason || reason.trim().length === 0) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Reason is required",
        },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Validate target selection
    let targetUsers: Array<{ id: string; name: string; email: string }> = [];

    switch (targetType) {
      case "single":
        if (!targetUserId) {
          const response = NextResponse.json(
            {
              success: false,
              error: "Target user ID is required for single user commission push",
            },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        const singleUser = await db.user.findFirst({
          where: {
            id: targetUserId,
            name: { not: null },
            email: { not: null }
          },
          select: { id: true, name: true, email: true },
        });

        if (!singleUser) {
          const response = NextResponse.json(
            {
              success: false,
              error: "Target user not found or has incomplete information",
            },
            { status: 404 },
          );
          return addAPISecurityHeaders(response);
        }

        targetUsers = [{
          id: singleUser.id,
          name: singleUser.name!,
          email: singleUser.email!,
        }];
        break;

      case "multiple":
        if (!targetUserIds || targetUserIds.length === 0) {
          const response = NextResponse.json(
            {
              success: false,
              error: "Target user IDs are required for multiple user commission push",
            },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        const multipleUsers = await db.user.findMany({
          where: {
            id: { in: targetUserIds },
            name: { not: null },
            email: { not: null }
          },
          select: { id: true, name: true, email: true },
        });

        if (multipleUsers.length !== targetUserIds.length) {
          const foundIds = multipleUsers.map((u: { id: string }) => u.id);
          const missingIds = targetUserIds.filter((id: string) => !foundIds.includes(id));

          const response = NextResponse.json(
            {
              success: false,
              error: `Some users not found: ${missingIds.join(", ")}`,
            },
            { status: 404 },
          );
          return addAPISecurityHeaders(response);
        }

        targetUsers = multipleUsers.map((user: { id: string; name: string | null; email: string | null }) => ({
          id: user.id,
          name: user.name!,
          email: user.email!,
        }));
        break;

      case "all":
        // Get all active users with complete information
        const allUsers = await db.user.findMany({
          where: {
            status: "ACTIVE",
            name: { not: null },
            email: { not: null }
          },
          select: { id: true, name: true, email: true },
        });

        targetUsers = allUsers.map((user: { id: string; name: string | null; email: string | null }) => ({
          id: user.id,
          name: user.name!,
          email: user.email!,
        }));

        if (targetUsers.length === 0) {
          const response = NextResponse.json(
            {
              success: false,
              error: "No active users found to send commission push",
            },
            { status: 404 },
          );
          return addAPISecurityHeaders(response);
        }
        break;

      default:
        const response = NextResponse.json(
          {
            success: false,
            error: "Invalid target type",
          },
          { status: 400 },
        );
        return addAPISecurityHeaders(response);
    }

    // Calculate total amount
    const totalAmount = amount * targetUsers.length;

    // Process commission pushes
    const results: Array<{
      userId: string;
      userName: string;
      amount: number;
      transactionId: string;
      success: boolean;
    }> = [];
    const failedUsers: Array<{
      userId: string;
      userName: string;
      error: string;
    }> = [];

    for (const user of targetUsers) {
      try {
        // Create wallet transaction for the commission
        const transaction = await db.walletTransaction.create({
          data: {
            userId: user.id,
            type: isBonus ? "CREDIT" : "TASK_INCOME",
            amount: amount,
            balanceAfter: 0, // Will be updated by trigger
            description: `Special Commission Push: ${reason}${description ? ` - ${description}` : ""}`,
            referenceId: `special-commission-${Date.now()}-${user.id}`,
            status: "COMPLETED",
            metadata: JSON.stringify({
              isSpecialCommission: true,
              isBonus,
              isUrgent,
              reason,
              description,
              processedBy: admin.id,
              processedAt: new Date().toISOString(),
            }),
          },
        });

        // Create activity log
        await db.activityLog.create({
          data: {
            userId: user.id,
            activity: "special_commission_received",
            description: `Received special commission of PKR ${amount} for: ${reason}`,
            metadata: JSON.stringify({
              amount,
              reason,
              isBonus,
              isUrgent,
              processedBy: admin.id,
            }),
            ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
          },
        });

        results.push({
          userId: user.id,
          userName: user.name,
          amount,
          transactionId: transaction.id,
          success: true,
        });

        // Send notification to user if requested
        if (notifyUser) {
          await notificationService.createNotification(
            NotificationType.USER_ACTION,
            `Special Commission Received - PKR ${amount}`,
            `You have received a special commission of PKR ${amount} for: ${reason}${description ? `\n\n${description}` : ""}`,
            {
              severity: NotificationSeverity.SUCCESS,
              targetType: "user",
              targetId: user.id,
              actionUrl: "/wallet",
              metadata: {
                amount,
                reason,
                isBonus,
                isUrgent,
                type: "special_commission",
              },
            },
          );
        }
      } catch (error) {
        console.error(`Failed to process commission for user ${user.id}:`, error);
        failedUsers.push({
          userId: user.id,
          userName: user.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Log audit event
    await auditService.logUserAction(
      admin.id,
      AuditAction.BULK_UPDATE,
      "multiple",
      `Special commission push sent to ${results.length} users. Total amount: PKR ${totalAmount}. Reason: ${reason}`,
      {
        targetType,
        totalUsers: targetUsers.length,
        successfulUsers: results.length,
        failedUsers: failedUsers.length,
        totalAmount,
        amountPerUser: amount,
        reason,
        description,
        isBonus,
        isUrgent,
        results,
      },
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      request.headers.get("user-agent") || "unknown",
    );

    // Return response
    const response = NextResponse.json({
      success: true,
      message: `Special commission push processed successfully. Sent to ${results.length} users, total amount: PKR ${totalAmount}`,
      data: {
        totalUsers: targetUsers.length,
        successfulUsers: results.length,
        failedUsers: failedUsers.length,
        totalAmount,
        amountPerUser: amount,
        results,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Special commission push API error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );

    return addAPISecurityHeaders(response);
  }
}

// Preview endpoint for special commission push
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await adminAuthMiddleware(request);

    if (!admin) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Only SUPER_ADMIN can preview special commission pushes
    if (admin.role !== "SUPER_ADMIN") {
      const response = NextResponse.json(
        {
          success: false,
          error: "Forbidden - Super Admin access required",
        },
        { status: 403 },
      );
      return addAPISecurityHeaders(response);
    }

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType") as "single" | "multiple" | "all";
    const targetUserId = searchParams.get("targetUserId");
    const targetUserIds = searchParams.get("targetUserIds")?.split(",").filter(Boolean);
    const amount = parseFloat(searchParams.get("amount") || "0");

    if (!amount || amount <= 0) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Invalid amount",
        },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get target users count
    let totalUsers = 0;
    let affectedUsers: Array<{ id: string; name: string; email: string }> = [];

    switch (targetType) {
      case "single":
        if (!targetUserId) {
          const response = NextResponse.json(
            {
              success: false,
              error: "Target user ID is required for single user preview",
            },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        const singleUser = await db.user.findFirst({
          where: {
            id: targetUserId,
            name: { not: null },
            email: { not: null }
          },
          select: { id: true, name: true, email: true },
        });

        if (!singleUser) {
          const response = NextResponse.json(
            {
              success: false,
              error: "Target user not found",
            },
            { status: 404 },
          );
          return addAPISecurityHeaders(response);
        }

        totalUsers = 1;
        affectedUsers = [{
          id: singleUser.id,
          name: singleUser.name!,
          email: singleUser.email!,
        }];
        break;

      case "multiple":
        if (!targetUserIds || targetUserIds.length === 0) {
          const response = NextResponse.json(
            {
              success: false,
              error: "Target user IDs are required for multiple user preview",
            },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        const multipleUsers = await db.user.findMany({
          where: {
            id: { in: targetUserIds },
            name: { not: null },
            email: { not: null }
          },
          select: { id: true, name: true, email: true },
        });

        totalUsers = multipleUsers.length;
        affectedUsers = multipleUsers.map((user: { id: string; name: string | null; email: string | null }) => ({
          id: user.id,
          name: user.name!,
          email: user.email!,
        }));
        break;

      case "all":
        // Get count of all active users
        totalUsers = await db.user.count({
          where: { status: "ACTIVE" },
        });

        // Get sample of users for preview (limit to 10)
        const sampleUsers = await db.user.findMany({
          where: {
            status: "ACTIVE",
            name: { not: null },
            email: { not: null }
          },
          select: { id: true, name: true, email: true },
          take: 10,
        });

        affectedUsers = sampleUsers.map((user: { id: string; name: string | null; email: string | null }) => ({
          id: user.id,
          name: user.name!,
          email: user.email!,
        }));
        break;

      default:
        const response = NextResponse.json(
          {
            success: false,
            error: "Invalid target type",
          },
          { status: 400 },
        );
        return addAPISecurityHeaders(response);
    }

    const totalAmount = amount * totalUsers;

    const response = NextResponse.json({
      success: true,
      message: "Preview generated successfully",
      data: {
        totalUsers,
        totalAmount,
        amountPerUser: amount,
        affectedUsers,
        targetType,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Special commission preview API error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );

    return addAPISecurityHeaders(response);
  }
}
