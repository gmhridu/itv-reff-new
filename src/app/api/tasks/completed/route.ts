import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db } from "@/lib/db";
import { NotificationService } from "@/lib/notification-service";
import { NotificationType, NotificationSeverity } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };

    if (startDate || endDate) {
      where.watchedAt = {};
      if (startDate) {
        where.watchedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.watchedAt.lte = new Date(endDate);
      }
    }

    // Get completed tasks with video details
    const [completedTasks, totalCount] = await Promise.all([
      db.userVideoTask.findMany({
        where,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailUrl: true,
              duration: true,
            },
          },
        },
        orderBy: { watchedAt: "desc" },
        take: limit,
        skip,
      }),
      db.userVideoTask.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await db.userVideoTask.aggregate({
      where,
      _sum: {
        rewardEarned: true,
        watchDuration: true,
      },
      _count: {
        id: true,
      },
    });

    // Get today's completed tasks count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasksCount = await db.userVideoTask.count({
      where: {
        userId: user.id,
        watchedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return NextResponse.json({
      completedTasks: completedTasks.map((task) => ({
        id: task.id,
        video: {
          id: task.video.id,
          title: task.video.title,
          description: task.video.description,
          thumbnailUrl: task.video.thumbnailUrl,
          duration: task.video.duration,
        },
        completedAt: task.watchedAt.toISOString(),
        rewardEarned: task.rewardEarned,
        positionLevel: task.positionLevel,
        watchDuration: task.watchDuration,
        isVerified: task.isVerified,
      })),
      summary: {
        totalTasks: summary._count.id || 0,
        totalRewards: summary._sum.rewardEarned || 0,
        totalWatchTime: summary._sum.watchDuration || 0,
        todayTasksCount,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get completed tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function sendTaskCompletionNotification(
  userId: string,
  rewardAmount: number,
) {
  try {
    await NotificationService.createNotification(
      {
        type: "TASK_COMPLETED" as any, // Using string literal instead of enum property
        title: "Task Reward Received",
        message: `You've earned PKR${rewardAmount.toFixed(2)} for completing your daily task.`,
        severity: "SUCCESS",
        actionUrl: "/dashboard/task",
      },
      userId,
    );
  } catch (error) {
    console.error("Error sending task completion notification:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get the full user object with position information
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        currentPositionId: true,
        walletBalance: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { videoId, watchDuration } = body;

    // Validate input
    if (!videoId || !watchDuration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if task already completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingTask = await db.userVideoTask.findFirst({
      where: {
        userId: user.id,
        videoId,
        watchedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingTask) {
      return NextResponse.json(
        { error: "Task already completed today" },
        { status: 400 },
      );
    }

    // Get video details
    const video = await db.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Calculate reward (simplified logic)
    const rewardAmount = video.rewardAmount;

    // Create task completion record
    const task = await db.userVideoTask.create({
      data: {
        userId: user.id,
        videoId,
        watchedAt: new Date(),
        watchDuration,
        rewardEarned: rewardAmount,
        positionLevel: fullUser.currentPositionId || undefined,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        deviceId: request.headers.get("user-agent") || undefined,
        isVerified: true, // Simplified for this example
      },
    });

    // Update user commission balance (Daily Task Commission only)
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        commissionBalance: { increment: rewardAmount },
      },
    });

    // Create transaction record
    await db.walletTransaction.create({
      data: {
        userId: user.id,
        type: "TASK_INCOME",
        amount: rewardAmount,
        balanceAfter: updatedUser.commissionBalance,
        description: `Task completion reward for video: ${video.title}`,
        referenceId: `TASK_${task.id}`,
        status: "COMPLETED",
      },
    });

    // Send notification
    await sendTaskCompletionNotification(user.id, rewardAmount);

    return NextResponse.json({
      message: "Task completed successfully",
      task: {
        id: task.id,
        rewardEarned: task.rewardEarned,
        completedAt: task.watchedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Complete task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
