import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { TaskBonusService } from "@/lib/task-bonus-service";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authMiddleware(request);
    if (!user || !user.id) {
      const response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    const body = await request.json();
    const { userId, date } = body;

    // If userId is provided, process for that user, otherwise process for current user
    const targetUserId = userId || user.id;

    // Process daily task bonus
    const result = await TaskBonusService.processDailyTaskBonus(targetUserId, date ? new Date(date) : undefined);

    if (result.success && result.rewards) {
      const response = NextResponse.json({
        success: true,
        message: result.message,
        rewards: result.rewards,
        dailyEarnings: result.dailyEarnings,
        completionStatus: result.completionStatus,
      });
      return addAPISecurityHeaders(response);
    } else {
      const response = NextResponse.json({
        success: false,
        message: result.message,
        completionStatus: result.completionStatus,
      }, { status: 400 });
      return addAPISecurityHeaders(response);
    }
  } catch (error) {
    console.error("Task bonus processing error:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authMiddleware(request);
    if (!user || !user.id) {
      const response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // If userId is provided, get stats for that user, otherwise get for current user
    const targetUserId = userId || user.id;

    const stats = await TaskBonusService.getUserTaskBonusStats(
      targetUserId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    const response = NextResponse.json({
      success: true,
      stats,
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Get task bonus stats error:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
