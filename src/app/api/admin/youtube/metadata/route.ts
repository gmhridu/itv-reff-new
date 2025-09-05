import { NextRequest, NextResponse } from "next/server";
import { getYouTubeVideoMetadata } from "@/lib/youtube";
import { ApiResponse } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Video ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate video ID format
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid YouTube video ID format",
        } as ApiResponse,
        { status: 400 }
      );
    }

    try {
      const metadata = await getYouTubeVideoMetadata(videoId);

      if (!metadata) {
        return NextResponse.json(
          {
            success: false,
            error: "Video not found or metadata unavailable",
          } as ApiResponse,
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: metadata,
          message: "Video metadata retrieved successfully",
        } as ApiResponse,
        { status: 200 }
      );
    } catch (error: any) {
      console.error("YouTube metadata fetch error:", error);

      // Handle specific YouTube API errors
      if (error.code === "QUOTA_EXCEEDED") {
        return NextResponse.json(
          {
            success: false,
            error: "YouTube API quota exceeded. Please try again later.",
          } as ApiResponse,
          { status: 429 }
        );
      }

      if (error.code === "VIDEO_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            error: "Video not found or is private/deleted",
          } as ApiResponse,
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch video metadata",
          message: error.message || "Unknown error occurred",
        } as ApiResponse,
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("YouTube metadata API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
