import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { db } from '@/lib/db';
import { PositionService } from '@/lib/position-service';

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'User Not Found!' },
        { status: 404 }
      );
    }

    // Check user's position and task availability
    const canCompleteTask = await PositionService.canCompleteTask(user.id);
    const userPosition = await PositionService.getUserCurrentPosition(user.id);

    if (!userPosition || !userPosition.position) {
      return NextResponse.json({
        videos: [],
        error: 'No active position found',
        canCompleteTask: false
      });
    }

    const tasksCompletedToday = await PositionService.getDailyTasksCompleted(user.id);
    const position = userPosition.position!;
    const dailyTaskLimit = position.tasksPerDay;



    // If user cannot complete more tasks, return empty array
    if (!canCompleteTask.canComplete) {
      return NextResponse.json({
        videos: [],
        dailyTaskLimit,
        tasksCompletedToday,
        canCompleteTask: false,
        reason: canCompleteTask.reason
      });
    }

    // Get all watched videos (ever) due to unique constraint
    const watchedTasks = await db.userVideoTask.findMany({
      where: {
        userId: user.id
      },
      select: { videoId: true }
    });

    const watchedVideoIds = watchedTasks.map(task => task.videoId);

    const videos = await db.video.findMany({
      where: {
        isActive: true,
        id: { notIn: watchedVideoIds },
      },
      orderBy: { createdAt: 'desc' },
    });



    return NextResponse.json({
      videos: videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        rewardAmount: position.unitPrice,
      })),
      dailyTaskLimit,
      tasksCompletedToday: tasksCompletedToday,
      canCompleteTask: true,
      tasksRemaining: canCompleteTask.tasksRemaining,
      currentPosition: {
        name: position.name,
        level: position.level,
        unitPrice: position.unitPrice
      }
    });

  } catch (error) {
    console.error('Get videos error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
