import { NextRequest, NextResponse } from "next/server";
import { authMiddleware, validateVideoWatchRequest } from "@/lib/api/api-auth";
import { db } from "@/lib/db";
import { ReferralService } from "@/lib/referral-service";
import { PositionService } from "@/lib/position-service";
import { TaskManagementBonusService } from "@/lib/task-management-bonus-service";
import { EnhancedReferralService } from "@/lib/enhanced-referral-service";
import { UserNotificationService } from "@/lib/user-notification-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id: videoId } = await params;

    // Security validation
    const isValid = validateVideoWatchRequest(request);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Get video details
    const video = await db.video.findFirst({
      where: { id: videoId, isActive: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check if user already watched this video (unique constraint: userId + videoId)
    const existingTask = await db.userVideoTask.findFirst({
      where: {
        userId: user.id,
        videoId: videoId,
      },
    });

    if (existingTask) {
      return NextResponse.json(
        {
          error: "Video already completed",
          message: "You have already watched and completed this video.",
          completedAt: existingTask.watchedAt,
          rewardEarned: existingTask.rewardEarned,
        },
        { status: 400 },
      );
    }

    // Check user's position and task limits using new position system
    const canCompleteTask = await PositionService.canCompleteTask(user.id);

    if (!canCompleteTask.canComplete) {
      return NextResponse.json(
        { error: canCompleteTask.reason },
        { status: 400 },
      );
    }

    // Get user's current position for reward calculation
    const userPosition = await PositionService.getUserCurrentPosition(user.id);

    if (!userPosition || !userPosition.position) {
      return NextResponse.json(
        { error: "No active position found" },
        { status: 400 },
      );
    }

    const position = userPosition.position!;
    const rewardPerVideo = position.unitPrice;
    const dailyLimit = position.tasksPerDay;

    // Count today's watched videos
    const todayTasksCount = await PositionService.getDailyTasksCompleted(
      user.id,
    );

    // Get client IP and device info
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const body = await request.json();
    const {
      watchDuration,
      verificationData,
      userInteractions = [],
      hasStarted,
      minimumWatchTimeMet,
    } = body;

    // Simple 10-second validation as requested by user
    const MINIMUM_WATCH_TIME = 10; // 10 seconds as required

    console.log("Video watch validation:", {
      watchDuration,
      minimumRequired: MINIMUM_WATCH_TIME,
      videoDuration: video.duration,
      verificationData,
      hasStarted,
      minimumWatchTimeMet,
    });

    // Validate minimum watch time (10 seconds)
    if (watchDuration < MINIMUM_WATCH_TIME) {
      return NextResponse.json(
        {
          error: "Video not watched long enough",
          details: {
            watchDuration: watchDuration,
            minimumRequired: MINIMUM_WATCH_TIME,
            message: "You must watch at least 10 seconds to earn the reward",
          },
        },
        { status: 400 },
      );
    }

    // Basic anti-cheat: ensure watch duration is not excessive (max 2x video duration)
    if (watchDuration > video.duration * 2) {
      return NextResponse.json(
        { error: "Invalid watch duration detected" },
        { status: 400 },
      );
    }

    // Use the actual watch duration from frontend
    const actualWatchDuration = watchDuration;

    // Calculate reward
    const rewardEarned = rewardPerVideo;

    // Create video task record with position information
    const videoTask = await db.userVideoTask.create({
      data: {
        userId: user.id,
        videoId: videoId,
        watchedAt: new Date(),
        watchDuration: actualWatchDuration, // Use corrected watch duration
        rewardEarned: rewardEarned,
        positionLevel: position.name,
        ipAddress,
        deviceId: "web-client",
        isVerified: true,
      },
    });

    // Update user's commission balance (Daily Task Commission only)
    await db.user.update({
      where: { id: user.id },
      data: {
        commissionBalance: user.commissionBalance + rewardEarned,
      },
    });

    // Create transaction record
    await db.walletTransaction.create({
      data: {
        userId: user.id,
        type: "TASK_INCOME",
        amount: rewardEarned,
        balanceAfter: user.commissionBalance + rewardEarned,
        description: `Task reward: ${video.title} (${position.name})`,
        referenceId: `TASK_${videoTask.id}`,
        status: "COMPLETED",
        metadata: JSON.stringify({
          videoId: videoId,
          watchDuration: actualWatchDuration,
          positionLevel: position.name,
          verificationData,
          userInteractions,
          ipAddress,
          hasStarted,
          minimumWatchTimeMet,
          securityScore: calculateSecurityScore(
            actualWatchDuration,
            video.duration,
            userInteractions,
          ),
        }),
      },
    });

    // Distribute management bonuses to upline
    const bonusResult =
      await TaskManagementBonusService.distributeManagementBonuses(
        user.id,
        rewardEarned,
        new Date(),
      );

    if (bonusResult.success && bonusResult.totalBonusDistributed > 0) {
      console.log(
        `Management bonuses distributed: ${bonusResult.totalBonusDistributed} PKR`,
      );
    }

    // Process referral rewards
    const totalVideosWatched = await db.userVideoTask.count({
      where: { userId: user.id },
    });

    // Check for first video referral reward
    if (totalVideosWatched === 1) {
      const firstVideoResult =
        await ReferralService.processReferralQualification(
          user.id,
          "first_video",
        );

      if (firstVideoResult.success && firstVideoResult.rewardAmount) {
        console.log(
          `First video referral reward: $${firstVideoResult.rewardAmount} awarded`,
        );
      }
    }

    // Check for weekly activity milestone (7 videos)
    if (totalVideosWatched === 7) {
      await ReferralService.processReferralQualification(
        user.id,
        "weekly_activity",
      );
    }

    // Check for high earner milestone ($50 total earnings)
    const updatedUser = await db.user.findUnique({
      where: { id: user.id },
      select: { totalEarnings: true },
    });

    if (
      updatedUser &&
      updatedUser.totalEarnings >= 50 &&
      updatedUser.totalEarnings - rewardEarned < 50
    ) {
      await ReferralService.processReferralQualification(
        user.id,
        "high_earner",
      );
    }

    // Send notification about video completion and earnings
    try {
      await UserNotificationService.notifyVideoEarnings(
        user.id,
        video.title,
        rewardEarned,
        "Main Wallet",
      );
    } catch (notificationError) {
      console.error(
        "Failed to send video completion notification:",
        notificationError,
      );
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      message: "Task completed successfully",
      rewardEarned: rewardEarned,
      newCommissionBalance: user.commissionBalance + rewardEarned,
      tasksCompletedToday: todayTasksCount + 1,
      dailyTaskLimit: dailyLimit,
      positionLevel: position.name,
      managementBonusDistributed: bonusResult.totalBonusDistributed,
      bonusBreakdown: bonusResult.bonusBreakdown,
      debug: {
        watchDuration: watchDuration,
        minimumRequired: MINIMUM_WATCH_TIME,
        videoDuration: video.duration,
        hasStarted,
        minimumWatchTimeMet,
        verificationData,
      },
    });
  } catch (error) {
    console.error("Video watch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper function to calculate security score for 10-second minimum
function calculateSecurityScore(
  watchDuration: number,
  videoDuration: number,
  userInteractions: any[],
): number {
  let score = 100;

  // Deduct points for watching less than 10 seconds
  if (watchDuration < 10) {
    score -= 50;
  }

  // Deduct points for no user interactions
  if (userInteractions.length === 0) {
    score -= 20;
  }

  // Deduct points for excessive watch time
  if (watchDuration > videoDuration * 2) {
    score -= 30;
  }

  // Bonus points for reasonable watch time
  if (watchDuration >= 10 && watchDuration <= videoDuration) {
    score += 10;
  }

  return Math.max(0, score);
}
