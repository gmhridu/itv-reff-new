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
    const { watchDuration, verificationData, userInteractions = [] } = body;

    // Enhanced anti-cheat validation with duration mismatch detection
    console.log("Video duration debug:", {
      videoDuration: video.duration,
      videoDurationType: typeof video.duration,
      calculatedMinimum: video.duration * 0.8,
      verificationDuration: verificationData?.duration,
      videoData: {
        id: video.id,
        title: video.title,
        duration: video.duration,
      },
    });

    // Detect duration mismatch between database and actual video
    let actualVideoDuration = video.duration;
    if (
      verificationData?.duration &&
      Math.abs(video.duration - verificationData.duration) > 10
    ) {
      // Use the actual video duration from verification data
      actualVideoDuration = verificationData.duration;
      console.log(
        "Using actual video duration for validation:",
        actualVideoDuration,
      );
    }

    const minimumWatchTime = actualVideoDuration * 0.8; // 80% of actual video duration

    // Use verification data as fallback if watchDuration is 0 (new segment-based tracking)
    let actualWatchDuration = watchDuration;
    if (watchDuration === 0 && verificationData?.watchPercentage) {
      actualWatchDuration = Math.floor(
        (verificationData.watchPercentage / 100) * actualVideoDuration,
      );
    }

    if (actualWatchDuration < minimumWatchTime) {
      return NextResponse.json(
        {
          error: "Video not watched long enough",
          details: {
            watchDuration: actualWatchDuration,
            minimumRequired: minimumWatchTime,
            watchPercentage: verificationData?.watchPercentage || 0,
          },
        },
        { status: 400 },
      );
    }

    // Check for suspicious patterns using actual video duration
    if (actualWatchDuration > actualVideoDuration * 2) {
      return NextResponse.json(
        { error: "Invalid watch duration" },
        { status: 400 },
      );
    }

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

    // Update user's wallet balance and total earnings
    await db.user.update({
      where: { id: user.id },
      data: {
        walletBalance: user.walletBalance + rewardEarned,
        totalEarnings: user.totalEarnings + rewardEarned,
      },
    });

    // Create transaction record
    await db.walletTransaction.create({
      data: {
        userId: user.id,
        type: "TASK_INCOME",
        amount: rewardEarned,
        balanceAfter: user.walletBalance + rewardEarned,
        description: `Task reward: ${video.title} (${position.name})`,
        referenceId: `TASK_${videoTask.id}`,
        status: "COMPLETED",
        metadata: JSON.stringify({
          videoId: videoId,
          watchDuration: actualWatchDuration, // Use corrected watch duration
          originalWatchDuration: watchDuration, // Keep original for debugging
          positionLevel: position.name,
          verificationData,
          userInteractions,
          ipAddress,
          securityScore: calculateSecurityScore(
            actualWatchDuration,
            actualVideoDuration,
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
      newBalance: user.walletBalance + rewardEarned,
      tasksCompletedToday: todayTasksCount + 1,
      dailyTaskLimit: dailyLimit,
      positionLevel: position.name,
      managementBonusDistributed: bonusResult.totalBonusDistributed,
      bonusBreakdown: bonusResult.bonusBreakdown,
      debug: {
        originalWatchDuration: watchDuration,
        actualWatchDuration: actualWatchDuration,
        watchPercentage: verificationData?.watchPercentage || 0,
        minimumRequired: minimumWatchTime,
        databaseVideoDuration: video.duration,
        actualVideoDuration: actualVideoDuration,
        durationMismatchDetected:
          Math.abs(
            video.duration - (verificationData?.duration || video.duration),
          ) > 10,
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

// Helper function to calculate security score
function calculateSecurityScore(
  watchDuration: number,
  videoDuration: number,
  userInteractions: any[],
): number {
  let score = 100;

  // Deduct points for short watch time
  if (watchDuration < videoDuration * 0.8) {
    score -= 30;
  }

  // Deduct points for no user interactions
  if (userInteractions.length === 0) {
    score -= 20;
  }

  // Deduct points for exact duration matches (possible automation)
  if (Math.abs(watchDuration - videoDuration) < 1) {
    score -= 15;
  }

  // Deduct points for excessive watch time
  if (watchDuration > videoDuration * 1.5) {
    score -= 10;
  }

  return Math.max(0, score);
}
