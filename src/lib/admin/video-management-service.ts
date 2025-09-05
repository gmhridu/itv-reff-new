import { db as prisma, withRetry } from "@/lib/db";
import {
  VideoManagement,
  VideoUploadData,
  VideoFilters,
  VideoAnalytics,
  PositionLevelInfo,
  PaginationParams,
  PaginatedResponse,
} from "@/types/admin";
import { Prisma } from "@prisma/client";

export class VideoManagementService {
  /**
   * Get paginated videos with filters
   */
  async getVideos(
    filters: VideoFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 },
  ): Promise<PaginatedResponse<VideoManagement>> {
    const {
      page,
      limit,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const whereClause = this.buildWhereClause(filters);

    // Build order by clause
    const orderBy = this.buildOrderByClause(sortBy, sortOrder);

    const [videos, totalCount] = await Promise.all([
      this.getVideosWithDetails(whereClause, orderBy, skip, limit),
      prisma.video.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: videos,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get single video by ID with full details
   */
  async getVideoById(videoId: string): Promise<VideoManagement | null> {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        positionLevel: true,
        videoTasks: {
          where: { isVerified: true },
          select: {
            id: true,
            rewardEarned: true,
            watchDuration: true,
            watchedAt: true,
          },
        },
      },
    });

    if (!video) return null;

    return this.mapVideoToVideoManagement(video);
  }

  /**
   * Create new video
   */
  async createVideo(videoData: VideoUploadData): Promise<VideoManagement> {
    const video = await withRetry(async (db) =>
      db.video.create({
        data: {
          title: videoData.title,
          description: videoData.description,
          url: videoData.url,
          thumbnailUrl: videoData.thumbnailUrl,
          duration: videoData.duration,
          rewardAmount: videoData.rewardAmount,
          positionLevelId: videoData.positionLevelId,
          availableFrom: videoData.availableFrom,
          availableTo: videoData.availableTo,
          isActive: videoData.isActive ?? true,
          uploadMethod: videoData.uploadMethod || "file",
          youtubeVideoId: videoData.youtubeVideoId,
          cloudinaryPublicId: videoData.cloudinaryPublicId,
          tags: videoData.tags ? JSON.stringify(videoData.tags) : null,
        },
        include: {
          positionLevel: true,
          videoTasks: {
            where: { isVerified: true },
            select: {
              id: true,
              rewardEarned: true,
              watchDuration: true,
              watchedAt: true,
            },
          },
        },
      }),
    );

    return this.mapVideoToVideoManagement(video);
  }

  /**
   * Update video
   */
  async updateVideo(
    videoId: string,
    updateData: Partial<VideoUploadData>,
  ): Promise<VideoManagement> {
    // Extract and transform the update data to match Prisma schema
    const {
      title,
      description,
      url,
      thumbnailUrl,
      duration,
      rewardAmount,
      positionLevelId,
      availableFrom,
      availableTo,
      isActive,
      uploadMethod,
      youtubeVideoId,
      cloudinaryPublicId,
      tags,
    } = updateData;

    const updatePayload: any = {
      updatedAt: new Date(),
    };

    // Only include fields that are defined in updateData
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (url !== undefined) updatePayload.url = url;
    if (thumbnailUrl !== undefined) updatePayload.thumbnailUrl = thumbnailUrl;
    if (duration !== undefined) updatePayload.duration = duration;
    if (rewardAmount !== undefined) updatePayload.rewardAmount = rewardAmount;
    if (positionLevelId !== undefined)
      updatePayload.positionLevelId = positionLevelId;
    if (availableFrom !== undefined)
      updatePayload.availableFrom = availableFrom;
    if (availableTo !== undefined) updatePayload.availableTo = availableTo;
    if (isActive !== undefined) updatePayload.isActive = isActive;
    if (uploadMethod !== undefined) updatePayload.uploadMethod = uploadMethod;
    if (youtubeVideoId !== undefined)
      updatePayload.youtubeVideoId = youtubeVideoId;
    if (cloudinaryPublicId !== undefined)
      updatePayload.cloudinaryPublicId = cloudinaryPublicId;
    if (tags !== undefined) updatePayload.tags = JSON.stringify(tags);

    const video = await withRetry(async (db) =>
      db.video.update({
        where: { id: videoId },
        data: updatePayload,
        include: {
          positionLevel: true,
          videoTasks: {
            where: { isVerified: true },
            select: {
              id: true,
              rewardEarned: true,
              watchDuration: true,
              watchedAt: true,
            },
          },
        },
      }),
    );

    return this.mapVideoToVideoManagement(video);
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      // Check if video has any tasks
      const taskCount = await prisma.userVideoTask.count({
        where: { videoId },
      });

      if (taskCount > 0) {
        // Soft delete - just mark as inactive
        await prisma.video.update({
          where: { id: videoId },
          data: { isActive: false },
        });
      } else {
        // Hard delete if no tasks
        await prisma.video.delete({
          where: { id: videoId },
        });
      }

      return true;
    } catch (error) {
      console.error("Error deleting video:", error);
      return false;
    }
  }

  /**
   * Toggle video active status
   */
  async toggleVideoStatus(videoId: string): Promise<VideoManagement> {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { isActive: true },
    });

    if (!video) {
      throw new Error("Video not found");
    }

    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: { isActive: !video.isActive },
      include: {
        positionLevel: true,
        videoTasks: {
          where: { isVerified: true },
          select: {
            id: true,
            rewardEarned: true,
            watchDuration: true,
            watchedAt: true,
          },
        },
      },
    });

    return this.mapVideoToVideoManagement(updatedVideo);
  }

  /**
   * Get video analytics
   */
  async getVideoAnalytics(
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 10,
  ): Promise<VideoAnalytics[]> {
    const endDate = dateTo || new Date();
    const startDate =
      dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const results = await prisma.$queryRaw<
      {
        id: string;
        title: string;
        views: number;
        total_rewards_paid: number;
        avg_watch_time: number;
        completion_rate: number;
      }[]
    >`
      SELECT
        v.id,
        v.title,
        COUNT(uvt.id)::INT as views,
        SUM(uvt.reward_earned)::FLOAT as total_rewards_paid,
        AVG(uvt.watch_duration)::FLOAT as avg_watch_time,
        (COUNT(CASE WHEN uvt.watch_duration >= v.duration * 0.8 THEN 1 END)::FLOAT / NULLIF(COUNT(uvt.id), 0)::FLOAT * 100) as completion_rate
      FROM videos v
      LEFT JOIN user_video_tasks uvt ON v.id = uvt.video_id
        AND uvt.watched_at >= ${startDate}
        AND uvt.watched_at <= ${endDate}
        AND uvt.is_verified = true
      WHERE v.is_active = true
      GROUP BY v.id, v.title, v.duration
      ORDER BY views DESC, total_rewards_paid DESC
      LIMIT ${limit};
    `;

    return results.map((row) => ({
      id: row.id,
      title: row.title,
      views: row.views || 0,
      engagement: row.completion_rate || 0,
      totalRewardsPaid: row.total_rewards_paid || 0,
      averageWatchTime: row.avg_watch_time || 0,
      completionRate: row.completion_rate || 0,
    }));
  }

  /**
   * Get video statistics
   */
  async getVideoStatistics(): Promise<{
    totalVideos: number;
    activeVideos: number;
    inactiveVideos: number;
    totalViews: number;
    totalRewardsPaid: number;
    averageCompletionRate: number;
    videosByPositionLevel: { [level: string]: number };
  }> {
    const [
      totalVideos,
      activeVideos,
      inactiveVideos,
      totalViews,
      totalRewardsPaid,
      videosByPosition,
    ] = await Promise.all([
      prisma.video.count(),
      prisma.video.count({ where: { isActive: true } }),
      prisma.video.count({ where: { isActive: false } }),
      prisma.userVideoTask.count({ where: { isVerified: true } }),
      prisma.userVideoTask.aggregate({
        _sum: { rewardEarned: true },
        where: { isVerified: true },
      }),
      prisma.video.groupBy({
        by: ["positionLevelId"],
        _count: true,
        where: { isActive: true },
      }),
    ]);

    // Calculate average completion rate
    const completionRateResult = await prisma.$queryRaw<
      [{ avg_completion_rate: number }]
    >`
      SELECT AVG(
        CASE
          WHEN v.duration > 0
          THEN (COUNT(CASE WHEN uvt.watch_duration >= v.duration * 0.8 THEN 1 END)::FLOAT / NULLIF(COUNT(uvt.id), 0)::FLOAT * 100)
          ELSE 0
        END
      )::FLOAT as avg_completion_rate
      FROM videos v
      LEFT JOIN user_video_tasks uvt ON v.id = uvt.video_id AND uvt.is_verified = true
      WHERE v.is_active = true
      GROUP BY v.id, v.duration;
    `;

    // Map position level data
    const videosByPositionLevel: { [level: string]: number } = {};
    for (const item of videosByPosition) {
      const levelName = item.positionLevelId || "No Level";
      videosByPositionLevel[levelName] = item._count;
    }

    return {
      totalVideos,
      activeVideos,
      inactiveVideos,
      totalViews,
      totalRewardsPaid: totalRewardsPaid._sum.rewardEarned || 0,
      averageCompletionRate: completionRateResult[0]?.avg_completion_rate || 0,
      videosByPositionLevel,
    };
  }

  /**
   * Get available position levels
   */
  async getPositionLevels(): Promise<PositionLevelInfo[]> {
    const levels = await prisma.positionLevel.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
    });

    return levels.map((level) => ({
      id: level.id,
      name: level.name,
      level: level.level,
      deposit: level.deposit,
      tasksPerDay: level.tasksPerDay,
      unitPrice: level.unitPrice,
      validityDays: level.validityDays,
    }));
  }

  /**
   * Bulk update videos
   */
  async bulkUpdateVideos(
    videoIds: string[],
    updateData: Partial<VideoUploadData>,
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    // Extract and transform the update data to match Prisma schema
    const {
      title,
      description,
      url,
      thumbnailUrl,
      duration,
      rewardAmount,
      positionLevelId,
      availableFrom,
      availableTo,
      isActive,
      uploadMethod,
      youtubeVideoId,
      cloudinaryPublicId,
      tags,
    } = updateData;

    const updatePayload: any = {
      updatedAt: new Date(),
    };

    // Only include fields that are defined in updateData
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (url !== undefined) updatePayload.url = url;
    if (thumbnailUrl !== undefined) updatePayload.thumbnailUrl = thumbnailUrl;
    if (duration !== undefined) updatePayload.duration = duration;
    if (rewardAmount !== undefined) updatePayload.rewardAmount = rewardAmount;
    if (positionLevelId !== undefined)
      updatePayload.positionLevelId = positionLevelId;
    if (availableFrom !== undefined)
      updatePayload.availableFrom = availableFrom;
    if (availableTo !== undefined) updatePayload.availableTo = availableTo;
    if (isActive !== undefined) updatePayload.isActive = isActive;
    if (uploadMethod !== undefined) updatePayload.uploadMethod = uploadMethod;
    if (youtubeVideoId !== undefined)
      updatePayload.youtubeVideoId = youtubeVideoId;
    if (cloudinaryPublicId !== undefined)
      updatePayload.cloudinaryPublicId = cloudinaryPublicId;
    if (tags !== undefined) updatePayload.tags = JSON.stringify(tags);

    for (const videoId of videoIds) {
      try {
        await prisma.video.update({
          where: { id: videoId },
          data: updatePayload,
        });
        updated++;
      } catch (error) {
        console.error(`Failed to update video ${videoId}:`, error);
        failed.push(videoId);
      }
    }

    return { updated, failed };
  }

  /**
   * Get video watch history
   */
  async getVideoWatchHistory(
    videoId: string,
    pagination: PaginationParams = { page: 1, limit: 10 },
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [watchHistory, totalCount] = await Promise.all([
      prisma.userVideoTask.findMany({
        where: { videoId, isVerified: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { watchedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.userVideoTask.count({
        where: { videoId, isVerified: true },
      }),
    ]);

    return {
      data: watchHistory,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Private helper methods
   */
  private buildWhereClause(filters: VideoFilters): Prisma.VideoWhereInput {
    const where: Prisma.VideoWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.positionLevelId) {
      where.positionLevelId = filters.positionLevelId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.searchTerm) {
      where.OR = [
        { title: { contains: filters.searchTerm, mode: "insensitive" } },
        { description: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private buildOrderByClause(
    sortBy: string,
    sortOrder: "asc" | "desc",
  ): Prisma.VideoOrderByWithRelationInput {
    const validSortFields = [
      "createdAt",
      "title",
      "duration",
      "rewardAmount",
      "updatedAt",
    ];

    if (!validSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    return { [sortBy]: sortOrder };
  }

  private async getVideosWithDetails(
    where: Prisma.VideoWhereInput,
    orderBy: Prisma.VideoOrderByWithRelationInput,
    skip: number,
    take: number,
  ): Promise<VideoManagement[]> {
    const videos = await prisma.video.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        positionLevel: true,
        videoTasks: {
          where: { isVerified: true },
          select: {
            id: true,
            rewardEarned: true,
            watchDuration: true,
            watchedAt: true,
          },
        },
      },
    });

    return videos.map(this.mapVideoToVideoManagement);
  }

  private mapVideoToVideoManagement(video: any): VideoManagement {
    const totalViews = video.videoTasks?.length || 0;
    const totalRewardsPaid =
      video.videoTasks?.reduce(
        (sum: number, task: any) => sum + task.rewardEarned,
        0,
      ) || 0;
    const averageWatchDuration =
      totalViews > 0
        ? video.videoTasks.reduce(
            (sum: number, task: any) => sum + task.watchDuration,
            0,
          ) / totalViews
        : 0;

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      url: video.url,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      rewardAmount: video.rewardAmount,
      isActive: video.isActive,
      availableFrom: video.availableFrom,
      availableTo: video.availableTo,
      positionLevelId: video.positionLevelId,
      positionLevel: video.positionLevel
        ? {
            id: video.positionLevel.id,
            name: video.positionLevel.name,
            level: video.positionLevel.level,
            deposit: video.positionLevel.deposit,
            tasksPerDay: video.positionLevel.tasksPerDay,
            unitPrice: video.positionLevel.unitPrice,
            validityDays: video.positionLevel.validityDays,
          }
        : null,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
      totalViews,
      totalRewardsPaid,
      averageWatchDuration,
      uploadMethod: video.uploadMethod || "file",
      youtubeVideoId: video.youtubeVideoId || null,
      cloudinaryPublicId: video.cloudinaryPublicId || null,
      tags: video.tags
        ? typeof video.tags === "string"
          ? JSON.parse(video.tags)
          : video.tags
        : [],
    };
  }
}

export const videoManagementService = new VideoManagementService();
