import { NextRequest, NextResponse } from "next/server";
import { videoManagementService } from "@/lib/admin/video-management-service";
import {
  uploadVideoToCloudinary,
  uploadThumbnailToCloudinary,
  generateVideoThumbnail,
  processYouTubeVideo,
  validateVideoFile,
  estimateUploadTime,
} from "@/lib/cloudinary";
import {
  smartVideoUpload,
  ChunkedUploadOptions,
  UploadProgressTracker,
  createUploadSession,
} from "@/lib/chunked-upload";
import {
  ApiResponse,
  CloudinaryUploadResponse,
  YouTubeVideoInfo,
} from "@/types/admin";

// Store active upload sessions (in production, use Redis or database)
const uploadSessions = new Map<string, {
  sessionId: string;
  totalChunks: number;
  uploadedChunks: number;
  videoData: any;
  createdAt: Date;
}>();

// Clean up old sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [sessionId, session] of uploadSessions.entries()) {
    if (session.createdAt < oneHourAgo) {
      uploadSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const action = formData.get("action") as string;

    if (action === "start") {
      return await handleStartUpload(formData);
    } else if (action === "chunk") {
      return await handleChunkUpload(formData);
    } else if (action === "complete") {
      return await handleCompleteUpload(formData);
    } else if (action === "abort") {
      return await handleAbortUpload(formData);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'start', 'chunk', 'complete', or 'abort'",
        } as ApiResponse,
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Chunked upload API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process chunked upload",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

async function handleStartUpload(formData: FormData): Promise<NextResponse> {
  try {
    const fileName = formData.get("fileName") as string;
    const fileSize = parseInt(formData.get("fileSize") as string);
    const fileType = formData.get("fileType") as string;
    const chunkSize = parseInt(formData.get("chunkSize") as string) || 10 * 1024 * 1024; // 10MB default

    // Video metadata
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const rewardAmount = parseFloat(formData.get("rewardAmount") as string);
    const positionLevelId = formData.get("positionLevelId") as string;
    const availableFrom = formData.get("availableFrom") as string;
    const availableTo = formData.get("availableTo") as string;
    const tags = formData.get("tags") as string;
    const isActive = formData.get("isActive") === "true";

    // Validate required fields
    if (!fileName || !fileSize || !fileType || !title || !rewardAmount) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: fileName, fileSize, fileType, title, rewardAmount",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (rewardAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Reward amount must be greater than 0",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/webm",
      "video/mkv",
      "video/flv",
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Allowed: MP4, AVI, MOV, WMV, WEBM, MKV, FLV",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate file size (max 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (fileSize > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File size too large. Maximum 2GB allowed",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Calculate total chunks
    const totalChunks = Math.ceil(fileSize / chunkSize);
    const sessionId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store video metadata for later use
    const videoData = {
      title,
      description,
      rewardAmount,
      positionLevelId: positionLevelId || undefined,
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      availableTo: availableTo ? new Date(availableTo) : undefined,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      isActive: isActive ?? true,
      fileName,
      fileSize,
      fileType,
    };

    // Create session
    uploadSessions.set(sessionId, {
      sessionId,
      totalChunks,
      uploadedChunks: 0,
      videoData,
      createdAt: new Date(),
    });

    // Estimate upload time
    const estimatedTime = estimateUploadTime(fileSize);

    console.log(`Started chunked upload session: ${sessionId}, ${totalChunks} chunks, ${(fileSize / 1024 / 1024).toFixed(2)}MB`);

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId,
          totalChunks,
          chunkSize,
          estimatedTime,
          message: "Upload session started successfully",
        },
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Start upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to start upload session",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

async function handleChunkUpload(formData: FormData): Promise<NextResponse> {
  try {
    const sessionId = formData.get("sessionId") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const chunkData = formData.get("chunkData") as File;

    if (!sessionId || chunkIndex === undefined || !chunkData) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: sessionId, chunkIndex, chunkData",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const session = uploadSessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired upload session",
        } as ApiResponse,
        { status: 404 }
      );
    }

    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid chunk index. Must be between 0 and ${session.totalChunks - 1}`,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Convert chunk to buffer
    const chunkBuffer = Buffer.from(await chunkData.arrayBuffer());

    console.log(`Received chunk ${chunkIndex + 1}/${session.totalChunks} for session ${sessionId} (${chunkBuffer.length} bytes)`);

    // For now, we'll store chunks in memory (in production, use temporary file storage)
    if (!session.videoData.chunks) {
      session.videoData.chunks = new Array(session.totalChunks);
    }

    session.videoData.chunks[chunkIndex] = chunkBuffer;
    session.uploadedChunks++;

    // Update session
    uploadSessions.set(sessionId, session);

    const progress = (session.uploadedChunks / session.totalChunks) * 100;

    return NextResponse.json(
      {
        success: true,
        data: {
          chunkIndex,
          uploadedChunks: session.uploadedChunks,
          totalChunks: session.totalChunks,
          progress: Math.round(progress),
          message: `Chunk ${chunkIndex + 1}/${session.totalChunks} uploaded successfully`,
        },
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Chunk upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload chunk",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

async function handleCompleteUpload(formData: FormData): Promise<NextResponse> {
  try {
    const sessionId = formData.get("sessionId") as string;
    const thumbnailFile = formData.get("thumbnailFile") as File | null;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing sessionId",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const session = uploadSessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired upload session",
        } as ApiResponse,
        { status: 404 }
      );
    }

    if (session.uploadedChunks !== session.totalChunks) {
      return NextResponse.json(
        {
          success: false,
          error: `Upload incomplete. Expected ${session.totalChunks} chunks, got ${session.uploadedChunks}`,
        } as ApiResponse,
        { status: 400 }
      );
    }

    console.log(`Completing upload for session ${sessionId}`);

    // Reconstruct the file from chunks
    if (!session.videoData.chunks || session.videoData.chunks.length !== session.totalChunks) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing chunk data",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const completeBuffer = Buffer.concat(session.videoData.chunks);

    console.log(`Reconstructed file: ${completeBuffer.length} bytes`);

    let videoUrl: string;
    let thumbnailUrl: string;
    let duration: number = 0;
    let cloudinaryPublicId: string | null = null;

    try {
      // Upload video to Cloudinary with progress tracking
      const chunkedOptions: ChunkedUploadOptions = {
        folder: "videos",
        public_id: `video_${Date.now()}`,
        tags: [
          "itv-video",
          ...session.videoData.tags,
        ],
        quality: "auto",
        format: "mp4",
        timeout: 600000, // 10 minutes timeout
        onProgress: (progress) => {
          console.log(`Cloudinary upload progress: ${progress.toFixed(1)}%`);
        },
        onChunkComplete: (chunkIndex, totalChunks) => {
          console.log(`Cloudinary chunk ${chunkIndex + 1}/${totalChunks} completed`);
        },
      };

      console.log("Starting Cloudinary upload...");
      const cloudinaryResponse = await smartVideoUpload(completeBuffer, chunkedOptions);

      videoUrl = cloudinaryResponse.secure_url;
      duration = cloudinaryResponse.duration || 0;
      cloudinaryPublicId = cloudinaryResponse.public_id;

      console.log(`Cloudinary upload completed: ${cloudinaryPublicId}`);

      // Handle thumbnail
      if (thumbnailFile) {
        console.log("Uploading custom thumbnail...");
        const thumbBytes = await thumbnailFile.arrayBuffer();
        const thumbBuffer = Buffer.from(thumbBytes);
        const thumbResponse = await uploadThumbnailToCloudinary(thumbBuffer, {
          public_id: `thumb_${Date.now()}`,
        });
        thumbnailUrl = thumbResponse.secure_url;
      } else {
        console.log("Generating thumbnail from video...");
        thumbnailUrl = generateVideoThumbnail(cloudinaryResponse.public_id);
      }

    } catch (error) {
      console.error("Cloudinary upload error:", error);

      // Clean up session
      uploadSessions.delete(sessionId);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload video to Cloudinary",
          message: error instanceof Error ? error.message : "Unknown error",
        } as ApiResponse,
        { status: 500 }
      );
    }

    try {
      // Create video record in database
      const videoData = {
        title: session.videoData.title,
        description: session.videoData.description,
        url: videoUrl,
        thumbnailUrl,
        duration,
        rewardAmount: session.videoData.rewardAmount,
        positionLevelId: session.videoData.positionLevelId,
        availableFrom: session.videoData.availableFrom,
        availableTo: session.videoData.availableTo,
        isActive: session.videoData.isActive,
        uploadMethod: "file" as const,
        youtubeVideoId: undefined,
        cloudinaryPublicId: cloudinaryPublicId || undefined,
        tags: session.videoData.tags,
      };

      console.log("Creating video record in database...");
      const createdVideo = await videoManagementService.createVideo(videoData);

      // Clean up session
      uploadSessions.delete(sessionId);

      console.log(`Video created successfully: ${createdVideo.id}`);

      return NextResponse.json(
        {
          success: true,
          data: {
            video: createdVideo,
            uploadInfo: {
              uploadMethod: "file",
              cloudinaryPublicId,
              originalVideoUrl: videoUrl,
              thumbnailUrl,
              duration,
              chunksUploaded: session.totalChunks,
              totalSize: completeBuffer.length,
            },
          },
          message: "Video uploaded and created successfully",
        } as ApiResponse,
        { status: 201 }
      );

    } catch (error) {
      console.error("Database error:", error);

      // Clean up session
      uploadSessions.delete(sessionId);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to save video to database",
          message: error instanceof Error ? error.message : "Unknown error",
        } as ApiResponse,
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Complete upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete upload",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

async function handleAbortUpload(formData: FormData): Promise<NextResponse> {
  try {
    const sessionId = formData.get("sessionId") as string;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing sessionId",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const session = uploadSessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired upload session",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Clean up session
    uploadSessions.delete(sessionId);

    console.log(`Upload session ${sessionId} aborted`);

    return NextResponse.json(
      {
        success: true,
        message: "Upload session aborted successfully",
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Abort upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to abort upload",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// GET endpoint to check upload session status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing sessionId parameter",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const session = uploadSessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired upload session",
        } as ApiResponse,
        { status: 404 }
      );
    }

    const progress = (session.uploadedChunks / session.totalChunks) * 100;

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId: session.sessionId,
          uploadedChunks: session.uploadedChunks,
          totalChunks: session.totalChunks,
          progress: Math.round(progress),
          isComplete: session.uploadedChunks === session.totalChunks,
        },
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Get upload status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get upload status",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
