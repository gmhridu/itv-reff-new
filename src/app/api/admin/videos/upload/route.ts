import { NextRequest, NextResponse } from "next/server";
import { videoManagementService } from "@/lib/admin/video-management-service";
import {
  uploadVideoToCloudinary,
  uploadThumbnailToCloudinary,
  generateVideoThumbnail,
  processYouTubeVideo,
} from "@/lib/cloudinary";
import {
  ApiResponse,
  CloudinaryUploadResponse,
  YouTubeVideoInfo,
} from "@/types/admin";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const uploadMethod = formData.get("uploadMethod") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const positionLevelId = formData.get("positionLevelId") as string;
    const availableFrom = formData.get("availableFrom") as string;
    const availableTo = formData.get("availableTo") as string;
    const tags = formData.get("tags") as string;
    const isActive = formData.get("isActive") === "true";
    const youtubeThumbnailUrl = formData.get("youtubeThumbnailUrl") as string;

    // Validate required fields
    if (!uploadMethod || !title) {
      return NextResponse.json(
        {
          success: false,
          error: "Upload method and title are required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    if (!positionLevelId) {
      return NextResponse.json(
        {
          success: false,
          error: "Position level is required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Get reward amount from position level
    let rewardAmount: number = 0;
    if (positionLevelId) {
      try {
        const positionLevel = await prisma.positionLevel.findUnique({
          where: { id: positionLevelId },
          select: { unitPrice: true },
        });

        if (positionLevel) {
          rewardAmount = positionLevel.unitPrice;
        } else {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid position level selected",
            } as ApiResponse,
            { status: 400 },
          );
        }
      } catch (error) {
        console.error("Error fetching position level:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch position level details",
          } as ApiResponse,
          { status: 500 },
        );
      }
    }

    let videoUrl: string;
    let thumbnailUrl: string;
    let duration: number = 0;
    let youtubeVideoId: string | null = null;
    let cloudinaryPublicId: string | null = null;

    if (uploadMethod === "file") {
      // Handle file upload via Cloudinary
      const videoFile = formData.get("videoFile") as File;
      const thumbnailFile = formData.get("thumbnailFile") as File | null;

      if (!videoFile) {
        return NextResponse.json(
          {
            success: false,
            error: "Video file is required for file upload",
          } as ApiResponse,
          { status: 400 },
        );
      }

      // Validate file type
      const allowedTypes = [
        "video/mp4",
        "video/avi",
        "video/mov",
        "video/wmv",
        "video/webm",
      ];
      if (!allowedTypes.includes(videoFile.type)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid file type. Allowed: MP4, AVI, MOV, WMV, WEBM",
          } as ApiResponse,
          { status: 400 },
        );
      }

      // Validate file size (500MB max)
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (videoFile.size > maxSize) {
        return NextResponse.json(
          {
            success: false,
            error: "File size too large. Maximum 500MB allowed",
          } as ApiResponse,
          { status: 400 },
        );
      }

      try {
        // Convert file to buffer
        const bytes = await videoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(
          `Starting upload: ${videoFile.name}, Size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
        );

        // Upload video to Cloudinary with enhanced options and progress tracking
        const cloudinaryResponse = await uploadVideoToCloudinary(buffer, {
          public_id: `video_${Date.now()}`,
          folder: "itv-videos",
          tags: [
            "itv-video",
            ...(tags ? tags.split(",").map((tag) => tag.trim()) : []),
          ],
          timeout: 600000, // 10 minutes timeout
          onProgress: (progress: number) => {
            console.log(`Upload progress: ${progress.toFixed(1)}%`);
          },
          onChunkComplete: (chunkIndex: number, totalChunks: number) => {
            console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded`);
          },
        });

        videoUrl = cloudinaryResponse.secure_url;
        duration = cloudinaryResponse.duration || 0;
        cloudinaryPublicId = cloudinaryResponse.public_id;

        console.log(
          `Video uploaded successfully: ${cloudinaryPublicId}, Duration: ${duration}s`,
        );

        // Handle thumbnail
        if (thumbnailFile) {
          console.log("Uploading custom thumbnail...");
          // Upload custom thumbnail
          const thumbBytes = await thumbnailFile.arrayBuffer();
          const thumbBuffer = Buffer.from(thumbBytes);
          const thumbResponse = await uploadThumbnailToCloudinary(thumbBuffer, {
            public_id: `thumb_${Date.now()}`,
            timeout: 120000, // 2 minutes for thumbnail
          });
          thumbnailUrl = thumbResponse.secure_url;
          console.log("Custom thumbnail uploaded successfully");
        } else {
          console.log("Generating thumbnail from video...");
          // Generate thumbnail from video
          thumbnailUrl = generateVideoThumbnail(cloudinaryResponse.public_id);
          console.log("Thumbnail generated from video");
        }
      } catch (error) {
        console.error("Cloudinary upload error:", error);

        // Enhanced error logging
        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }

        // Provide more specific error messages
        let errorMessage = "Failed to upload video to Cloudinary";
        let statusCode = 500;

        if (error instanceof Error) {
          if (
            error.message.includes("timeout") ||
            error.message.includes("TimeoutError")
          ) {
            errorMessage =
              "Upload timeout - file may be too large or connection is slow. Please try the chunked upload method for large files.";
            statusCode = 408;
          } else if (
            error.message.includes("413") ||
            error.message.includes("too large")
          ) {
            errorMessage =
              "File too large for direct upload. Please use the chunked upload method.";
            statusCode = 413;
          } else if (
            error.message.includes("network") ||
            error.message.includes("connection")
          ) {
            errorMessage =
              "Network error during upload. Please check your connection and try again.";
            statusCode = 503;
          }
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            message: error instanceof Error ? error.message : "Unknown error",
            suggestion:
              videoFile && videoFile.size > 100 * 1024 * 1024
                ? "Consider using the chunked upload API for files larger than 100MB"
                : undefined,
          } as ApiResponse,
          { status: statusCode },
        );
      }
    } else if (uploadMethod === "youtube") {
      // Handle YouTube URL
      const youtubeUrl = formData.get("youtubeUrl") as string;

      if (!youtubeUrl) {
        return NextResponse.json(
          {
            success: false,
            error: "YouTube URL is required for YouTube upload",
          } as ApiResponse,
          { status: 400 },
        );
      }

      try {
        // Process YouTube video with enhanced metadata fetching
        const youtubeData = await processYouTubeVideo(youtubeUrl);

        youtubeVideoId = youtubeData.videoId;
        videoUrl = youtubeUrl; // Store original YouTube URL, not embed URL
        thumbnailUrl = youtubeThumbnailUrl || youtubeData.thumbnailUrl;

        // Use metadata duration if available, otherwise try form input
        if (youtubeData.duration && youtubeData.duration > 0) {
          duration = youtubeData.duration;
        } else {
          const durationInput = formData.get("duration") as string;
          duration = durationInput ? parseFloat(durationInput) : 0;
        }

        // Auto-fill title and description from YouTube metadata if not provided
        if (youtubeData.metadata && !title.trim()) {
          // This would need form data modification, so we'll just log it for now
          console.log("YouTube metadata available:", {
            title: youtubeData.metadata.title,
            description: youtubeData.metadata.description,
            duration: youtubeData.metadata.duration,
          });
        }
      } catch (error) {
        console.error("YouTube processing error:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to process YouTube video",
            message:
              error instanceof Error
                ? error.message
                : "Invalid YouTube URL or video not accessible",
          } as ApiResponse,
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid upload method. Must be 'file' or 'youtube'",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Parse dates
    const parsedAvailableFrom = availableFrom
      ? new Date(availableFrom)
      : undefined;
    const parsedAvailableTo = availableTo ? new Date(availableTo) : undefined;

    // Validate dates
    if (parsedAvailableFrom && isNaN(parsedAvailableFrom.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid availableFrom date",
        } as ApiResponse,
        { status: 400 },
      );
    }

    if (parsedAvailableTo && isNaN(parsedAvailableTo.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid availableTo date",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Create video record in database
    const videoData = {
      title,
      description,
      url: videoUrl,
      thumbnailUrl,
      duration,
      rewardAmount,
      positionLevelId: positionLevelId || undefined,
      availableFrom: parsedAvailableFrom,
      availableTo: parsedAvailableTo,
      isActive: isActive ?? true,
      uploadMethod: uploadMethod as "file" | "youtube",
      youtubeVideoId: youtubeVideoId || undefined,
      cloudinaryPublicId: cloudinaryPublicId || undefined,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    };

    const createdVideo = await videoManagementService.createVideo(videoData);

    return NextResponse.json(
      {
        success: true,
        data: {
          video: createdVideo,
          uploadInfo: {
            uploadMethod,
            cloudinaryPublicId,
            youtubeVideoId,
            originalVideoUrl: videoUrl,
            thumbnailUrl,
            duration,
          },
        },
        message: "Video uploaded and created successfully",
      } as ApiResponse,
      { status: 201 },
    );
  } catch (error) {
    console.error("Video upload API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload video",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// GET endpoint to retrieve position levels for the form
export async function GET(req: NextRequest) {
  try {
    const positionLevels = await videoManagementService.getPositionLevels();

    return NextResponse.json(
      {
        success: true,
        data: positionLevels,
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Position levels API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch position levels",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
