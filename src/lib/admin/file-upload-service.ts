import { db as prisma } from "@/lib/db";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Define FileUploadType enum since it's not exported yet
export enum FileUploadType {
  VIDEO = "VIDEO",
  THUMBNAIL = "THUMBNAIL",
  AVATAR = "AVATAR",
  DOCUMENT = "DOCUMENT",
  OTHER = "OTHER",
}

export interface FileUploadData {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadType: FileUploadType;
  uploadedBy: string | null;
  uploader: {
    id: string;
    name: string;
    email: string;
  } | null;
  isProcessed: boolean;
  processingStatus: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileUploadFilters {
  uploadType?: FileUploadType;
  uploadedBy?: string;
  isProcessed?: boolean;
  processingStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface PaginatedFileUploads {
  files: FileUploadData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UploadOptions {
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  generateThumbnail?: boolean;
  processVideo?: boolean;
}

export interface UploadResult {
  success: boolean;
  file?: FileUploadData;
  error?: string;
  message?: string;
}

export class FileUploadService {
  private readonly uploadPath = process.env.UPLOAD_PATH || "./uploads";
  private readonly baseUrl = process.env.BASE_URL || "http://localhost:3000";

  constructor() {
    this.ensureUploadDirectories();
  }

  /**
   * Upload a file
   */
  async uploadFile(
    file: File | Buffer,
    originalName: string,
    uploadType: FileUploadType,
    uploadedBy: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, originalName, options);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Generate unique filename
      const fileName = this.generateFileName(originalName);
      const filePath = this.getFilePath(uploadType, fileName);
      const fullPath = path.join(this.uploadPath, filePath);

      // Save file to disk
      let fileBuffer: Buffer;
      if (file instanceof File) {
        fileBuffer = Buffer.from(await file.arrayBuffer());
      } else {
        fileBuffer = file;
      }

      await writeFile(fullPath, fileBuffer);

      // Get file metadata
      const metadata = await this.extractMetadata(fullPath, uploadType);

      // Save to database
      const fileRecord = await (prisma as any).fileUpload.create({
        data: {
          originalName,
          fileName,
          filePath,
          fileSize: fileBuffer.length,
          mimeType: this.getMimeType(originalName),
          uploadType,
          uploadedBy,
          metadata: metadata ? JSON.stringify(metadata) : null,
          processingStatus: this.requiresProcessing(uploadType)
            ? "pending"
            : "completed",
          isProcessed: !this.requiresProcessing(uploadType),
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Start background processing if needed
      if (this.requiresProcessing(uploadType)) {
        this.processFileAsync(fileRecord.id, fullPath, uploadType, options);
      }

      return {
        success: true,
        file: this.mapFileUpload(fileRecord),
        message: "File uploaded successfully",
      };
    } catch (error) {
      console.error("File upload error:", error);
      return {
        success: false,
        error: "Failed to upload file",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get paginated file uploads
   */
  async getFileUploads(
    filters: FileUploadFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
  ): Promise<PaginatedFileUploads> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where = this.buildWhereClause(filters);

    // Build order by clause
    const orderBy = { [sortBy]: sortOrder };

    const [files, totalCount] = await Promise.all([
      (prisma as any).fileUpload.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      (prisma as any).fileUpload.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      files: files.map(this.mapFileUpload),
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<FileUploadData | null> {
    const file = await (prisma as any).fileUpload.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!file) return null;

    return this.mapFileUpload(file);
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const file = await (prisma as any).fileUpload.findUnique({
        where: { id: fileId },
      });

      if (!file) return false;

      // Delete physical file
      const fullPath = path.join(this.uploadPath, file.filePath);
      if (existsSync(fullPath)) {
        await unlink(fullPath);
      }

      // Delete thumbnails if they exist
      if (file.uploadType === FileUploadType.VIDEO) {
        const thumbnailPath = this.getThumbnailPath(file.filePath);
        const fullThumbnailPath = path.join(this.uploadPath, thumbnailPath);
        if (existsSync(fullThumbnailPath)) {
          await unlink(fullThumbnailPath);
        }
      }

      // Delete from database
      await (prisma as any).fileUpload.delete({
        where: { id: fileId },
      });

      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(filePath: string): string {
    return `${this.baseUrl}/uploads/${filePath}`;
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(filePath: string): string {
    const thumbnailPath = this.getThumbnailPath(filePath);
    return `${this.baseUrl}/uploads/${thumbnailPath}`;
  }

  /**
   * Update file processing status
   */
  async updateProcessingStatus(
    fileId: string,
    status: string,
    metadata?: any,
  ): Promise<FileUploadData | null> {
    const file = await (prisma as any).fileUpload.update({
      where: { id: fileId },
      data: {
        processingStatus: status,
        isProcessed: status === "completed",
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        updatedAt: new Date(),
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.mapFileUpload(file);
  }

  /**
   * Get file statistics
   */
  async getFileStatistics(): Promise<{
    totalFiles: number;
    filesByType: { type: FileUploadType; count: number }[];
    totalSize: number;
    processingFiles: number;
    failedFiles: number;
  }> {
    const [totalFiles, filesByType, totalSize, processingFiles, failedFiles] =
      await Promise.all([
        (prisma as any).fileUpload.count(),
        (prisma as any).fileUpload.groupBy({
          by: ["uploadType"],
          _count: true,
        }),
        (prisma as any).fileUpload.aggregate({
          _sum: { fileSize: true },
        }),
        (prisma as any).fileUpload.count({
          where: { processingStatus: "processing" },
        }),
        (prisma as any).fileUpload.count({
          where: { processingStatus: "failed" },
        }),
      ]);

    return {
      totalFiles,
      filesByType: filesByType.map((item: any) => ({
        type: item.uploadType,
        count: item._count,
      })),
      totalSize: totalSize._sum.fileSize || 0,
      processingFiles,
      failedFiles,
    };
  }

  /**
   * Clean up orphaned files
   */
  async cleanupOrphanedFiles(): Promise<number> {
    const files = await (prisma as any).fileUpload.findMany({
      select: { id: true, filePath: true },
    });

    let deletedCount = 0;

    for (const file of files) {
      const fullPath = path.join(this.uploadPath, file.filePath);
      if (!existsSync(fullPath)) {
        await (prisma as any).fileUpload.delete({
          where: { id: file.id },
        });
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Private helper methods
   */
  private async ensureUploadDirectories(): Promise<void> {
    const directories = [
      "videos",
      "thumbnails",
      "avatars",
      "documents",
      "other",
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.uploadPath, dir);
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }
    }
  }

  private validateFile(
    file: File | Buffer,
    originalName: string,
    options: UploadOptions,
  ): { valid: boolean; error?: string } {
    // Check file size
    const fileSize = file instanceof File ? file.size : file.length;
    const maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default

    if (fileSize > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      };
    }

    // Check file type
    if (options.allowedTypes) {
      const fileExtension = path.extname(originalName).toLowerCase();
      if (!options.allowedTypes.includes(fileExtension)) {
        return {
          valid: false,
          error: `File type ${fileExtension} is not allowed`,
        };
      }
    }

    return { valid: true };
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);

    return `${baseName}_${timestamp}_${random}${extension}`;
  }

  private getFilePath(uploadType: FileUploadType, fileName: string): string {
    const typeDir = uploadType.toLowerCase();
    return `${typeDir}/${fileName}`;
  }

  private getThumbnailPath(filePath: string): string {
    const parsedPath = path.parse(filePath);
    return `thumbnails/${parsedPath.name}_thumb.jpg`;
  }

  private getMimeType(fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      ".mp4": "video/mp4",
      ".avi": "video/avi",
      ".mov": "video/quicktime",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    return mimeTypes[extension] || "application/octet-stream";
  }

  private requiresProcessing(uploadType: FileUploadType): boolean {
    return uploadType === FileUploadType.VIDEO;
  }

  private async extractMetadata(
    filePath: string,
    uploadType: FileUploadType,
  ): Promise<any> {
    // Basic metadata extraction
    // In a real implementation, you might use libraries like ffprobe for videos
    const metadata: any = {
      uploadType,
      processedAt: new Date().toISOString(),
    };

    if (uploadType === FileUploadType.VIDEO) {
      // For videos, you might extract duration, dimensions, etc.
      metadata.needsProcessing = true;
    }

    return metadata;
  }

  private async processFileAsync(
    fileId: string,
    filePath: string,
    uploadType: FileUploadType,
    options: UploadOptions,
  ): Promise<void> {
    try {
      // Update status to processing
      await this.updateProcessingStatus(fileId, "processing");

      // Process based on type
      if (uploadType === FileUploadType.VIDEO) {
        await this.processVideo(fileId, filePath, options);
      }

      // Update status to completed
      await this.updateProcessingStatus(fileId, "completed");
    } catch (error) {
      console.error("File processing error:", error);
      await this.updateProcessingStatus(fileId, "failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async processVideo(
    fileId: string,
    filePath: string,
    options: UploadOptions,
  ): Promise<void> {
    // Video processing logic would go here
    // This might include:
    // - Generating thumbnails
    // - Converting to different formats
    // - Extracting metadata (duration, dimensions, etc.)

    if (options.generateThumbnail) {
      // Generate thumbnail logic
      console.log(`Generating thumbnail for video: ${filePath}`);
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private buildWhereClause(filters: FileUploadFilters): any {
    const where: any = {};

    if (filters.uploadType) {
      where.uploadType = filters.uploadType;
    }

    if (filters.uploadedBy) {
      where.uploadedBy = filters.uploadedBy;
    }

    if (filters.isProcessed !== undefined) {
      where.isProcessed = filters.isProcessed;
    }

    if (filters.processingStatus) {
      where.processingStatus = filters.processingStatus;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.searchTerm) {
      where.OR = [
        { originalName: { contains: filters.searchTerm, mode: "insensitive" } },
        { fileName: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private mapFileUpload(file: any): FileUploadData {
    return {
      id: file.id,
      originalName: file.originalName,
      fileName: file.fileName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      uploadType: file.uploadType,
      uploadedBy: file.uploadedBy,
      uploader: file.uploader,
      isProcessed: file.isProcessed,
      processingStatus: file.processingStatus,
      metadata: file.metadata ? JSON.parse(file.metadata) : null,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }
}

export const fileUploadService = new FileUploadService();
