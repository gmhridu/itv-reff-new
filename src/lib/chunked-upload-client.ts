"use client";

export interface ChunkedUploadOptions {
  chunkSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (progress: number) => void;
  onChunkProgress?: (chunkIndex: number, totalChunks: number) => void;
  onError?: (error: Error) => void;
  onComplete?: (result: any) => void;
}

export interface UploadSession {
  sessionId: string;
  totalChunks: number;
  chunkSize: number;
  estimatedTime?: number;
}

export interface ChunkedUploadResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export class ChunkedUploadClient {
  private options: Required<ChunkedUploadOptions>;
  private abortController: AbortController | null = null;
  private isUploading = false;
  private currentFileSize = 0;

  constructor(options: ChunkedUploadOptions = {}) {
    this.options = {
      chunkSize: options.chunkSize || 10 * 1024 * 1024, // 10MB default
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      onProgress: options.onProgress || (() => {}),
      onChunkProgress: options.onChunkProgress || (() => {}),
      onError: options.onError || (() => {}),
      onComplete: options.onComplete || (() => {}),
    };
  }

  /**
   * Upload a file using chunked upload
   */
  async uploadFile(
    file: File,
    videoMetadata: {
      title: string;
      description: string;
      rewardAmount: number;
      positionLevelId?: string;
      availableFrom?: string;
      availableTo?: string;
      tags?: string;
      isActive?: boolean;
    },
    thumbnailFile?: File,
  ): Promise<ChunkedUploadResult> {
    if (this.isUploading) {
      throw new Error("Upload already in progress");
    }

    this.isUploading = true;
    this.abortController = new AbortController();
    this.currentFileSize = file.size;

    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Start upload session
      const session = await this.startUploadSession(file, videoMetadata);

      // Upload chunks
      await this.uploadChunks(file, session);

      // Complete upload
      const result = await this.completeUpload(
        session.sessionId,
        thumbnailFile,
      );

      this.options.onComplete(result);
      return result;
    } catch (error) {
      const uploadError =
        error instanceof Error ? error : new Error(String(error));
      this.options.onError(uploadError);

      return {
        success: false,
        error: uploadError.message,
      };
    } finally {
      this.isUploading = false;
      this.abortController = null;
    }
  }

  /**
   * Abort the current upload
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isUploading = false;
    this.currentFileSize = 0;
  }

  /**
   * Check if upload is in progress
   */
  isUploadInProgress(): boolean {
    return this.isUploading;
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/webm",
      "video/mkv",
      "video/flv",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error:
          "Invalid file type. Supported formats: MP4, AVI, MOV, WMV, WEBM, MKV, FLV",
      };
    }

    // Check file size (max 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size too large. Maximum 2GB allowed.",
      };
    }

    // Check minimum file size
    if (file.size < 1024) {
      return {
        isValid: false,
        error: "File size too small. Minimum 1KB required.",
      };
    }

    return { isValid: true };
  }

  /**
   * Start upload session
   */
  private async startUploadSession(
    file: File,
    videoMetadata: any,
  ): Promise<UploadSession> {
    const formData = new FormData();
    formData.append("action", "start");
    formData.append("fileName", file.name);
    formData.append("fileSize", file.size.toString());
    formData.append("fileType", file.type);
    formData.append("chunkSize", this.options.chunkSize.toString());

    // Add video metadata
    formData.append("title", videoMetadata.title);
    formData.append("description", videoMetadata.description);
    formData.append("rewardAmount", videoMetadata.rewardAmount.toString());

    if (videoMetadata.positionLevelId) {
      formData.append("positionLevelId", videoMetadata.positionLevelId);
    }
    if (videoMetadata.availableFrom) {
      formData.append("availableFrom", videoMetadata.availableFrom);
    }
    if (videoMetadata.availableTo) {
      formData.append("availableTo", videoMetadata.availableTo);
    }
    if (videoMetadata.tags) {
      formData.append("tags", videoMetadata.tags);
    }
    if (videoMetadata.isActive !== undefined) {
      formData.append("isActive", videoMetadata.isActive.toString());
    }

    const response = await fetch("/api/admin/videos/upload/chunked", {
      method: "POST",
      body: formData,
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to start upload session");
    }

    return result.data;
  }

  /**
   * Upload file chunks
   */
  private async uploadChunks(
    file: File,
    session: UploadSession,
  ): Promise<void> {
    const totalChunks = Math.ceil(file.size / this.options.chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      if (this.abortController?.signal.aborted) {
        throw new Error("Upload aborted");
      }

      const start = i * this.options.chunkSize;
      const end = Math.min(start + this.options.chunkSize, file.size);
      const chunk = file.slice(start, end);

      // Update progress before uploading chunk
      const progressBefore = (i / totalChunks) * 100;
      this.options.onProgress(progressBefore);
      this.options.onChunkProgress(i, totalChunks);

      await this.uploadChunk(session.sessionId, i, chunk);

      // Update progress after successful chunk upload
      const progressAfter = ((i + 1) / totalChunks) * 100;
      this.options.onProgress(Math.min(progressAfter, 100));
    }
  }

  /**
   * Upload a single chunk with retry logic
   */
  private async uploadChunk(
    sessionId: string,
    chunkIndex: number,
    chunk: Blob,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        // Show retry attempt if not first attempt
        if (attempt > 1) {
          this.options.onChunkProgress(
            chunkIndex,
            -1, // Use -1 to indicate retry status
          );
        }

        const formData = new FormData();
        formData.append("action", "chunk");
        formData.append("sessionId", sessionId);
        formData.append("chunkIndex", chunkIndex.toString());
        formData.append("chunkData", chunk);

        const response = await fetch("/api/admin/videos/upload/chunked", {
          method: "POST",
          body: formData,
          signal: this.abortController?.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to upload chunk");
        }

        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.options.maxRetries) {
          // Wait before retrying with exponential backoff
          const delay = this.options.retryDelay * Math.pow(2, attempt - 1);

          // Update progress to show retry
          const totalChunks = Math.ceil(
            this.getCurrentFileSize() / this.options.chunkSize,
          );
          this.options.onChunkProgress(chunkIndex, totalChunks);

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to upload chunk ${chunkIndex} after ${this.options.maxRetries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Helper method to get current file size (for progress calculation)
   */
  private getCurrentFileSize(): number {
    return this.currentFileSize || 0;
  }

  /**
   * Complete the upload
   */
  private async completeUpload(
    sessionId: string,
    thumbnailFile?: File,
  ): Promise<ChunkedUploadResult> {
    const formData = new FormData();
    formData.append("action", "complete");
    formData.append("sessionId", sessionId);

    if (thumbnailFile) {
      formData.append("thumbnailFile", thumbnailFile);
    }

    const response = await fetch("/api/admin/videos/upload/chunked", {
      method: "POST",
      body: formData,
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Abort upload session
   */
  private async abortUploadSession(sessionId: string): Promise<void> {
    try {
      const formData = new FormData();
      formData.append("action", "abort");
      formData.append("sessionId", sessionId);

      await fetch("/api/admin/videos/upload/chunked", {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      console.warn("Failed to abort upload session:", error);
    }
  }
}

/**
 * Utility function to create a chunked upload client
 */
export function createChunkedUploadClient(
  options?: ChunkedUploadOptions,
): ChunkedUploadClient {
  return new ChunkedUploadClient(options);
}

/**
 * Utility function to estimate upload time
 */
export function estimateUploadTime(
  fileSizeBytes: number,
  connectionSpeedMbps: number = 10,
): number {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  const connectionSpeedMBps = connectionSpeedMbps / 8; // Convert to MB/s
  const estimatedSeconds = (fileSizeMB / connectionSpeedMBps) * 1.5; // Add 50% buffer
  return Math.ceil(estimatedSeconds);
}

/**
 * Utility function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Utility function to format duration
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Progress tracking utilities
 */
export class UploadProgressTracker {
  private progress: number = 0;
  private startTime: number = 0;
  private callbacks: ((progress: ProgressInfo) => void)[] = [];

  start(): void {
    this.progress = 0;
    this.startTime = Date.now();
    this.notifyCallbacks();
  }

  update(progress: number): void {
    this.progress = Math.min(Math.max(progress, 0), 100);
    this.notifyCallbacks();
  }

  complete(): void {
    this.progress = 100;
    this.notifyCallbacks();
  }

  reset(): void {
    this.progress = 0;
    this.startTime = 0;
    this.notifyCallbacks();
  }

  onProgress(callback: (progress: ProgressInfo) => void): void {
    this.callbacks.push(callback);
  }

  private notifyCallbacks(): void {
    const elapsed = Date.now() - this.startTime;
    const estimated = this.progress > 0 ? (elapsed / this.progress) * 100 : 0;
    const remaining = estimated - elapsed;

    const info: ProgressInfo = {
      progress: this.progress,
      elapsed,
      estimated,
      remaining: Math.max(remaining, 0),
    };

    this.callbacks.forEach((callback) => callback(info));
  }
}

export interface ProgressInfo {
  progress: number;
  elapsed: number;
  estimated: number;
  remaining: number;
}
