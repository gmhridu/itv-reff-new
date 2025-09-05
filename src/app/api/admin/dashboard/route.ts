import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { ApiResponse, DashboardStats, RecentActivity } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    // Get basic stats
    const [
      totalUsers,
      activeUsers,
      totalVideos,
      totalVideoViews,
      totalRevenue,
      totalWithdrawals,
      pendingWithdrawals,
      averageUserEarnings,
      topPerformingVideo,
      recentActivity,
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),

      // Active users (logged in within last 7 days or completed tasks)
      prisma.user.count({
        where: {
          OR: [
            {
              lastLoginAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
            {
              videoTasks: {
                some: {
                  watchedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  },
                  isVerified: true,
                },
              },
            },
          ],
        },
      }),

      // Total videos count
      prisma.video.count({ where: { isActive: true } }),

      // Total video views
      prisma.userVideoTask.count({ where: { isVerified: true } }),

      // Total revenue (sum of all completed transactions)
      prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          type: {
            in: [
              "TASK_INCOME",
              "REFERRAL_REWARD_A",
              "REFERRAL_REWARD_B",
              "REFERRAL_REWARD_C",
              "MANAGEMENT_BONUS_A",
              "MANAGEMENT_BONUS_B",
              "MANAGEMENT_BONUS_C",
            ],
          },
        },
      }),

      // Total withdrawals processed
      prisma.withdrawalRequest.aggregate({
        _sum: { amount: true },
        where: { status: "PROCESSED" },
      }),

      // Pending withdrawals
      prisma.withdrawalRequest.aggregate({
        _sum: { amount: true },
        where: { status: "PENDING" },
      }),

      // Average user earnings
      prisma.user.aggregate({
        _avg: { totalEarnings: true },
      }),

      // Top performing video
      getTopPerformingVideo(),

      // Recent activity
      getRecentActivity(),
    ]);

    const stats: DashboardStats = {
      totalUsers,
      activeUsers,
      totalVideos,
      totalVideoViews,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalWithdrawals: totalWithdrawals._sum.amount || 0,
      pendingWithdrawals: pendingWithdrawals._sum.amount || 0,
      averageUserEarnings: averageUserEarnings._avg.totalEarnings || 0,
      topPerformingVideo,
      recentActivity,
    };

    return NextResponse.json(
      {
        success: true,
        data: stats,
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard stats",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

async function getTopPerformingVideo() {
  const result = await prisma.$queryRaw<
    Array<{ id: string; title: string; views: number }>
  >`
    SELECT v.id, v.title, COUNT(uvt.id)::INT as views
    FROM videos v
    LEFT JOIN user_video_tasks uvt ON v.id = uvt.video_id
      AND uvt.is_verified = true
    WHERE v.is_active = true
    GROUP BY v.id, v.title
    ORDER BY views DESC
    LIMIT 1;
  `;

  if (result.length === 0) {
    return null;
  }

  return {
    id: result[0].id,
    title: result[0].title,
    views: result[0].views || 0,
  };
}

async function getRecentActivity(): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // Get recent user registrations
  const recentUsers = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  recentUsers.forEach((user) => {
    activities.push({
      id: `user-reg-${user.id}`,
      type: "user_registration",
      description: `New user ${user.name || user.id} registered`,
      timestamp: user.createdAt,
      userId: user.id,
      userName: user.name || undefined,
    });
  });

  // Get recent video uploads
  const recentVideos = await prisma.video.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  recentVideos.forEach((video) => {
    activities.push({
      id: `video-upload-${video.id}`,
      type: "video_upload",
      description: `New video "${video.title}" uploaded`,
      timestamp: video.createdAt,
    });
  });

  // Get recent withdrawal requests
  const recentWithdrawals = await prisma.withdrawalRequest.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  recentWithdrawals.forEach((withdrawal) => {
    activities.push({
      id: `withdrawal-${withdrawal.id}`,
      type: "withdrawal_request",
      description: `Withdrawal request of $${withdrawal.amount} by ${withdrawal.user.name || withdrawal.user.id}`,
      timestamp: withdrawal.createdAt,
      userId: withdrawal.user.id,
      userName: withdrawal.user.name || undefined,
    });
  });

  // Get recent video task completions
  const recentTasks = await prisma.userVideoTask.findMany({
    where: {
      watchedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
      isVerified: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      video: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { watchedAt: "desc" },
    take: 10,
  });

  recentTasks.forEach((task) => {
    activities.push({
      id: `task-${task.id}`,
      type: "video_task_completed",
      description: `${task.user.name || task.user.id} completed "${task.video.title}"`,
      timestamp: task.watchedAt,
      userId: task.user.id,
      userName: task.user.name || undefined,
    });
  });

  // Sort all activities by timestamp and return the most recent 20
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 20);
}
