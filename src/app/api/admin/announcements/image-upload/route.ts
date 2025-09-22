import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { AdminMiddleware } from "@/lib/admin-middleware";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dp0x9kpzu",
  api_key: process.env.CLOUDINARY_API_KEY || "112789838518567",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "tD8jSB3hJZo5kJMs1J0hYxaMU4k",
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await AdminMiddleware.authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if Cloudinary is configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Cloudinary not configured. Please set environment variables.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for announcements)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with announcement-specific settings
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "announcements",
            transformation: [
              {
                width: 1200,
                height: 800,
                crop: "limit",
                quality: "auto:good",
                fetch_format: "auto",
              },
            ],
            tags: ["announcement", "admin-upload"],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    const result = uploadResult as any;

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
      message: "Announcement image uploaded successfully",
    });
  } catch (error) {
    console.error("Announcement image upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload image",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
