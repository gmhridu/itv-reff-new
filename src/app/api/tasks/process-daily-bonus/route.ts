import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { TaskBonusService } from "@/lib/task-bonus-service";
import { db } from "@/lib/db";

// This endpoint can be called by a cron job to process daily task bonuses
// It should be protected by a secret key in production
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (simple secret key check)
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "default-cron-secret";

    // In production, you should use a more secure method
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get date from request body or use today
    const body = await request.json().catch(() => ({}));
    const dateString = body.date;
    const targetDate = dateString ? new Date(dateString) : new Date();

    console.log(`Processing task bonuses for date: ${targetDate.toDateString()}`);

    // Process bonuses for all eligible users using scheduler service
    const result = await TaskBonusService.processDailyTaskBonusesForAllUsers(targetDate);

    console.log(`Task bonus processing complete:`, result);

    // Log summary to database for audit
    await db.systemLog.create({
      data: {
        level: "INFO",
        component: "TASK_BONUS",
        message: `Daily task bonus processing completed`,
        metadata: JSON.stringify({
          date: targetDate.toISOString(),
          processed: result.processed,
          successful: result.successful,
          failed: result.failed,
          totalBonusDistributed: result.totalBonusDistributed,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Task bonuses processed for ${targetDate.toDateString()}`,
      result: {
        date: targetDate.toISOString(),
        usersProcessed: result.processed,
        bonusesAwarded: result.successful,
        failed: result.failed,
        totalDistributed: result.totalBonusDistributed,
      },
    });
  } catch (error) {
    console.error("Error processing daily task bonuses:", error);

    // Log error to database
    await db.systemLog.create({
      data: {
        level: "ERROR",
        component: "TASK_BONUS",
        message: `Failed to process daily task bonuses`,
        metadata: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
    }).catch(console.error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process task bonuses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check the status of task bonus processing
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get("date");
    const targetDate = dateString ? new Date(dateString) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    // For 12 AM reset, we check from start of day to now (not end of day)
    const endOfDay = targetDate;

    // Get statistics for the date
    const [totalUsers, completedUsers, bonusesAwarded, totalAmount] = await Promise.all([
      // Total users who had tasks today
      db.userVideoTask.findMany({
        where: {
          watchedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { userId: true },
        distinct: ["userId"],
      }).then(users => users.length),

      // Users who completed 100% tasks
      db.userVideoTask.groupBy({
        by: ["userId"],
        where: {
          watchedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          isVerified: true,
        },
        _count: {
          id: true,
        },
      }).then(async (groups) => {
        let completedCount = 0;
        for (const group of groups) {
          const status = await TaskBonusService.checkDailyTaskCompletion(
            group.userId,
            targetDate
          );
          if (status.isComplete) completedCount++;
        }
        return completedCount;
      }),

      // Bonuses awarded for the date
      db.taskManagementBonus.count({
        where: {
          taskDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      // Total bonus amount distributed
      db.taskManagementBonus.aggregate({
        where: {
          taskDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: {
          bonusAmount: true,
        },
      }).then(result => result._sum.bonusAmount || 0),
    ]);

    // Get recent bonus transactions
    const recentBonuses = await db.taskManagementBonus.findMany({
      where: {
        taskDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: {
          select: { name: true, phone: true },
        },
        subordinate: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      date: targetDate.toISOString(),
      statistics: {
        totalUsersWithTasks: totalUsers,
        usersCompleted100Percent: completedUsers,
        bonusesAwarded,
        totalAmountDistributed: totalAmount,
        completionRate: totalUsers > 0 ? ((completedUsers / totalUsers) * 100).toFixed(1) + "%" : "0%",
      },
      recentBonuses: recentBonuses.map(bonus => ({
        referrer: bonus.user.name || bonus.user.phone,
        subordinate: bonus.subordinate.name || bonus.subordinate.phone,
        level: bonus.subordinateLevel,
        amount: bonus.bonusAmount,
        taskIncome: bonus.taskIncome,
        date: bonus.taskDate.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error getting task bonus status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get task bonus status",
      },
      { status: 500 }
    );
  }
}

