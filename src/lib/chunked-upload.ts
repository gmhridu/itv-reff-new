import { v2 as cloudinary } from "cloudinary";

// Configuration for chunked uploads
export const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second

export interface ChunkedUploadOptions {
  folder?: string;
  public_id?: string;
  tags?: string[];
  quality?: string;
  format?: string;
  timeout?: number;
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
}

export interface ChunkedUploadResult {
  public_id: string;
  secure_url: string;
  duration: number;
  format: string;
  bytes: number;
  width: number;
  height: number;
  chunks_uploaded: number;
  total_size: number;
}

export interface UploadSession {
  upload_id: string;
  chunks_uploaded: number;
  total_chunks: number;
  public_id: string;
}

/**
 * Splits a buffer into chunks of specified size
 */
export function createChunks(buffer: Buffer, chunkSize: number = CHUNK_SIZE): Buffer[] {
  const chunks: Buffer[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    const end = Math.min(offset + chunkSize, buffer.length);
    chunks.push(buffer.subarray(offset, end));
    offset = end;
  }

  return chunks;
}

/**
 * Creates a new upload session for chunked upload
 */
export async function createUploadSession(
  totalSize: number,
  options: ChunkedUploadOptions = {}
): Promise<UploadSession> {
  try {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const publicId = options.public_id || `video_${Date.now()}`;
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

    return {
      upload_id: uploadId,
      chunks_uploaded: 0,
      total_chunks: totalChunks,
      public_id: publicId,
    };
  } catch (error) {
    console.error("Failed to create upload session:", error);
    throw new Error("Failed to initialize chunked upload session");
  }
}

/**
 * Uploads a single chunk with retry logic
 */
export async function uploadChunk(
  chunk: Buffer,
  chunkIndex: number,
  session: UploadSession,
  options: ChunkedUploadOptions = {}
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const chunkBase64 = chunk.toString('base64');
      const dataUrl = `data:video/mp4;base64,${chunkBase64}`;

      // Use Cloudinary's upload with chunked parameters
      const uploadOptions = {
        resource_type: "video" as const,
        folder: options.folder || "videos",
        public_id: session.public_id,
        use_filename: false,
        unique_filename: false,
        overwrite: chunkIndex === 0 ? true : false,
        quality: options.quality || "auto",
        format: options.format || "mp4",
        timeout: options.timeout || 120000, // 2 minutes per chunk

        // Chunked upload parameters
        chunk_size: CHUNK_SIZE,
        eager_async: true,

        // For the first chunk, include transformation options
        ...(chunkIndex === 0 && {
          transformation: [
            {
              quality: "auto:good",
              fetch_format: "auto",
            },
          ],
        }),

        // Add tags if provided
        ...(options.tags && { tags: options.tags }),
      };

      let result;

      if (chunkIndex === 0) {
        // First chunk - start the upload
        result = await cloudinary.uploader.upload(dataUrl, {
          ...uploadOptions,
          resource_type: "video",
        });
      } else {
        // Subsequent chunks - append to existing upload
        result = await cloudinary.uploader.upload(dataUrl, {
          ...uploadOptions,
          public_id: session.public_id,
          overwrite: false,
          resource_type: "video",
        });
      }

      // Call progress callbacks
      if (options.onChunkComplete) {
        options.onChunkComplete(chunkIndex, session.total_chunks);
      }

      if (options.onProgress) {
        const progress = ((chunkIndex + 1) / session.total_chunks) * 100;
        options.onProgress(Math.min(progress, 100));
      }

      return result;

    } catch (error) {
      console.error(`Chunk upload attempt ${attempt}/${MAX_RETRIES} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        // Wait before retrying with exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to upload chunk ${chunkIndex} after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * Uploads a video file using chunked upload
 */
export async function uploadVideoChunked(
  buffer: Buffer,
  options: ChunkedUploadOptions = {}
): Promise<ChunkedUploadResult> {
  try {
    // Create upload session
    const session = await createUploadSession(buffer.length, options);

    // Split buffer into chunks
    const chunks = createChunks(buffer, CHUNK_SIZE);

    console.log(`Starting chunked upload: ${chunks.length} chunks, ${buffer.length} bytes total`);

    let finalResult: any = null;

    // Upload chunks sequentially to avoid overwhelming the server
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Uploading chunk ${i + 1}/${chunks.length} (${chunks[i].length} bytes)`);

      try {
        const chunkResult = await uploadChunk(chunks[i], i, session, options);

        // Store the final result from the last chunk
        finalResult = chunkResult;

        // Update session
        session.chunks_uploaded = i + 1;

      } catch (error) {
        console.error(`Failed to upload chunk ${i}:`, error);
        throw new Error(`Chunked upload failed at chunk ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (!finalResult) {
      throw new Error("No upload result received");
    }

    console.log(`Chunked upload completed successfully: ${session.public_id}`);

    return {
      public_id: finalResult.public_id,
      secure_url: finalResult.secure_url,
      duration: finalResult.duration || 0,
      format: finalResult.format,
      bytes: finalResult.bytes,
      width: finalResult.width || 0,
      height: finalResult.height || 0,
      chunks_uploaded: session.chunks_uploaded,
      total_size: buffer.length,
    };

  } catch (error) {
    console.error("Chunked upload failed:", error);
    throw new Error(`Chunked video upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Alternative approach using Cloudinary's large file upload
 */
export async function uploadLargeVideoToCloudinary(
  buffer: Buffer,
  options: ChunkedUploadOptions = {}
): Promise<ChunkedUploadResult> {
  try {
    // Use a streaming approach for large files
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64Data}`;

    const uploadOptions = {
      resource_type: "video" as const,
      folder: options.folder || "videos",
      public_id: options.public_id || `video_${Date.now()}`,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
      quality: options.quality || "auto",
      format: options.format || "mp4",

      // Large file optimizations
      chunk_size: 6000000, // 6MB chunks (Cloudinary's recommended size)
      timeout: 300000, // 5 minutes timeout
      eager_async: true,

      // Quality settings for large videos
      transformation: [
        {
          quality: "auto:good",
          fetch_format: "auto",
          video_codec: "auto",
        },
      ],

      // Progress callback simulation
      progress: (bytesUploaded: number, bytesTotal: number) => {
        if (options.onProgress) {
          const progress = (bytesUploaded / bytesTotal) * 100;
          options.onProgress(progress);
        }
      },

      // Add tags if provided
      ...(options.tags && { tags: options.tags }),
    };

    console.log(`Starting large file upload: ${buffer.length} bytes`);

    const result = await cloudinary.uploader.upload(dataUrl, uploadOptions);

    console.log(`Large file upload completed: ${result.public_id}`);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      duration: result.duration || 0,
      format: result.format,
      bytes: result.bytes,
      width: result.width || 0,
      height: result.height || 0,
      chunks_uploaded: 1,
      total_size: buffer.length,
    };

  } catch (error) {
    console.error("Large file upload failed:", error);

    // If large file upload fails, fallback to chunked upload
    console.log("Falling back to chunked upload...");
    return await uploadVideoChunked(buffer, options);
  }
}

/**
 * Utility function to determine the best upload method based on file size
 */
export async function smartVideoUpload(
  buffer: Buffer,
  options: ChunkedUploadOptions = {}
): Promise<ChunkedUploadResult> {
  const fileSizeMB = buffer.length / (1024 * 1024);

  console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);

  if (fileSizeMB > 100) {
    // Use chunked upload for files larger than 100MB
    console.log("Using chunked upload for large file");
    return await uploadVideoChunked(buffer, options);
  } else {
    // Try large file upload first, fallback to chunked if it fails
    console.log("Using large file upload with chunked fallback");
    return await uploadLargeVideoToCloudinary(buffer, options);
  }
}

/**
 * Progress tracking utility
 */
export class UploadProgressTracker {
  private callbacks: ((progress: number) => void)[] = [];
  private currentProgress: number = 0;

  onProgress(callback: (progress: number) => void): void {
    this.callbacks.push(callback);
  }

  updateProgress(progress: number): void {
    this.currentProgress = Math.min(Math.max(progress, 0), 100);
    this.callbacks.forEach(callback => callback(this.currentProgress));
  }

  getProgress(): number {
    return this.currentProgress;
  }

  reset(): void {
    this.currentProgress = 0;
    this.updateProgress(0);
  }
}

/**
 * Retry utility with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError?.message}`);
}
