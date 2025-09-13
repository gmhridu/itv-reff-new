import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db } from "@/lib/db";
import { PositionService } from "@/lib/position-service";

export async function GET(
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

    // Get user's current position for reward calculation
    const userPosition = await PositionService.getUserCurrentPosition(user.id);

    if (!userPosition || !userPosition.position) {
      return NextResponse.json(
        { error: "No active position found" },
        { status: 400 },
      );
    }

    const position = userPosition.position!;

    // Get video details
    const video = await db.video.findFirst({
      where: {
        id: videoId,
        isActive: true,
        availableFrom: { lte: new Date() },
        AND: [
          {
            OR: [{ availableTo: null }, { availableTo: { gte: new Date() } }],
          },
          {
            OR: [
              { positionLevelId: position.id }, // Videos specifically for this position
              { positionLevelId: null }, // Videos available to all positions
            ],
          },
        ],
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found or not available" },
        { status: 404 },
      );
    }

    // Check if user already watched this video (unique constraint: userId + videoId)
    const existingTask = await db.userVideoTask.findFirst({
      where: {
        userId: user.id,
        videoId: videoId,
      },
    });

    // Return video data regardless of completion status
    // Frontend will handle whether user can complete it again
    return NextResponse.json({
      id: video.id,
      title: video.title,
      description: video.description,
      url: video.url,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      rewardAmount: position.unitPrice, // Use position-based reward
      isCompleted: !!existingTask,
      completedAt: existingTask?.watchedAt,
      rewardEarned: existingTask?.rewardEarned,
    });
  } catch (error) {
    console.error("Get video error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
