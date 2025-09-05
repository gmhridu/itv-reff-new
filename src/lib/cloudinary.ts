import { v2 as cloudinary } from "cloudinary";
import {
  smartVideoUpload,
  ChunkedUploadOptions,
  ChunkedUploadResult,
  UploadProgressTracker,
} from "./chunked-upload";

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dp0x9kpzu",
  api_key: "112789838518567",
  api_secret: "tD8jSB3hJZo5kJMs1J0hYxaMU4k",
});

export { cloudinary };

// Cloudinary upload options for videos
export const VIDEO_UPLOAD_OPTIONS = {
  resource_type: "video" as const,
  folder: "videos",
  use_filename: true,
  unique_filename: true,
  overwrite: false,
  quality: "auto",
  format: "mp4",
  transformation: [
    {
      quality: "auto:good",
      fetch_format: "auto",
    },
  ],
};

// Image upload options for thumbnails
export const THUMBNAIL_UPLOAD_OPTIONS = {
  resource_type: "image" as const,
  folder: "itv-thumbnails",
  use_filename: true,
  unique_filename: true,
  overwrite: false,
  quality: "auto",
  format: "jpg",
  transformation: [
    {
      width: 1280,
      height: 720,
      crop: "fill",
      quality: "auto:good",
      fetch_format: "auto",
    },
  ],
};

// Helper function to upload video to Cloudinary with chunked upload support
export async function uploadVideoToCloudinary(
  file: Buffer | string,
  options: any = {},
): Promise<{
  public_id: string;
  secure_url: string;
  duration: number;
  format: string;
  bytes: number;
  width: number;
  height: number;
}> {
  try {
    // If it's a string (URL), use the traditional method
    if (typeof file === "string") {
      const result = await cloudinary.uploader.upload(file, {
        ...VIDEO_UPLOAD_OPTIONS,
        ...options,
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        duration: result.duration || 0,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      };
    }

    // For Buffer files, use smart chunked upload
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
    const fileSizeMB = buffer.length / (1024 * 1024);

    console.log(`Uploading video: ${fileSizeMB.toFixed(2)}MB`);

    // Prepare chunked upload options
    const chunkedOptions: ChunkedUploadOptions = {
      folder: options.folder || "videos",
      public_id: options.public_id,
      tags: options.tags,
      quality: options.quality || "auto",
      format: options.format || "mp4",
      timeout: options.timeout || 300000, // 5 minutes default timeout
      onProgress: options.onProgress,
      onChunkComplete: options.onChunkComplete,
    };

    // Use smart upload strategy based on file size
    const result = await smartVideoUpload(buffer, chunkedOptions);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      duration: result.duration,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    // Enhanced error logging
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    throw new Error(
      `Failed to upload video to Cloudinary: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Legacy function for backward compatibility - uses chunked upload internally
export async function uploadVideoToCloudinaryLegacy(
  file: Buffer | string,
  options: any = {},
): Promise<{
  public_id: string;
  secure_url: string;
  duration: number;
  format: string;
  bytes: number;
  width: number;
  height: number;
}> {
  try {
    const fileToUpload = Buffer.isBuffer(file)
      ? `data:video/mp4;base64,${file.toString("base64")}`
      : file;

    const result = await cloudinary.uploader.upload(fileToUpload, {
      ...VIDEO_UPLOAD_OPTIONS,
      ...options,
      timeout: 300000, // 5 minutes timeout
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      duration: result.duration || 0,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Cloudinary legacy upload error:", error);
    throw new Error("Failed to upload video to Cloudinary");
  }
}

// Helper function to upload thumbnail to Cloudinary
export async function uploadThumbnailToCloudinary(
  file: Buffer | string,
  options: any = {},
): Promise<{
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
}> {
  try {
    const fileToUpload = Buffer.isBuffer(file)
      ? `data:image/jpeg;base64,${file.toString("base64")}`
      : file;
    const result = await cloudinary.uploader.upload(fileToUpload, {
      ...THUMBNAIL_UPLOAD_OPTIONS,
      ...options,
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("Cloudinary thumbnail upload error:", error);
    throw new Error("Failed to upload thumbnail to Cloudinary");
  }
}

// Helper function to delete resource from Cloudinary
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" = "video",
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

// Helper function to generate video thumbnail
export function generateVideoThumbnail(
  videoPublicId: string,
  options: any = {},
): string {
  try {
    const thumbnailUrl = cloudinary.url(videoPublicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        {
          start_offset: "10%",
          width: 1280,
          height: 720,
          crop: "fill",
          quality: "auto:good",
        },
      ],
      ...options,
    });

    return thumbnailUrl;
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    throw new Error("Failed to generate thumbnail");
  }
}

// Import YouTube utilities for better functionality
import {
  extractYouTubeVideoId,
  getYouTubeThumbnail,
  getYouTubeEmbedUrl,
  getYouTubeVideoMetadata,
  convertToEmbedUrl,
  validateYouTubeUrl,
  formatDuration,
} from "./youtube";

// Re-export for backwards compatibility
export {
  extractYouTubeVideoId,
  getYouTubeThumbnail,
  getYouTubeEmbedUrl,
  convertToEmbedUrl,
  validateYouTubeUrl,
  formatDuration,
};

// Enhanced YouTube video processing
export async function processYouTubeVideo(url: string): Promise<{
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string;
  metadata?: any;
  duration?: number;
}> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  // Validate URL first
  const validation = await validateYouTubeUrl(url);
  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid YouTube video");
  }

  const embedUrl = getYouTubeEmbedUrl(videoId, {
    rel: false,
    controls: true,
  });

  const thumbnailUrl = getYouTubeThumbnail(videoId, "maxres");

  try {
    // Try to fetch metadata if API is available
    const metadata = await getYouTubeVideoMetadata(videoId);
    return {
      videoId,
      embedUrl,
      thumbnailUrl: metadata?.thumbnails.maxres || thumbnailUrl,
      metadata,
      duration: metadata?.duration,
    };
  } catch (error) {
    console.warn("Failed to fetch YouTube metadata, using fallback:", error);
    return {
      videoId,
      embedUrl,
      thumbnailUrl,
    };
  }
}

// Validate video file type
export function isValidVideoFile(file: File): boolean {
  const allowedTypes = [
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/webm",
    "video/mkv",
  ];

  return allowedTypes.includes(file.type);
}

// Validate video file size (in MB)
export function isValidVideoSize(file: File, maxSizeMB: number = 500): boolean {
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB <= maxSizeMB;
}

// Get video duration from file (returns promise)
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error("Failed to get video duration"));
    };

    video.src = URL.createObjectURL(file);
  });
}

// Create progress tracker instance
export function createUploadProgressTracker(): UploadProgressTracker {
  return new UploadProgressTracker();
}

// Utility function to estimate upload time based on file size
export function estimateUploadTime(
  fileSizeBytes: number,
  connectionSpeedMbps: number = 10,
): number {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  const connectionSpeedMBps = connectionSpeedMbps / 8; // Convert to MB/s
  const estimatedSeconds = (fileSizeMB / connectionSpeedMBps) * 1.5; // Add 50% buffer
  return Math.ceil(estimatedSeconds);
}

// Validate video file before upload
export function validateVideoFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file type
  if (!isValidVideoFile(file)) {
    return {
      isValid: false,
      error:
        "Invalid file type. Supported formats: MP4, AVI, MOV, WMV, FLV, WEBM, MKV",
    };
  }

  // Check file size (max 2GB)
  const maxSizeBytes = 2 * 1024 * 1024 * 1024; // 2GB
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: "File size too large. Maximum size allowed is 2GB.",
    };
  }

  // Check minimum file size (1KB to avoid empty files)
  if (file.size < 1024) {
    return {
      isValid: false,
      error: "File size too small. Minimum size is 1KB.",
    };
  }

  return { isValid: true };
}
