import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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
        orderBy: { watchedAt: 'desc' },
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
      completedTasks: completedTasks.map(task => ({
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
    console.error('Get completed tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
