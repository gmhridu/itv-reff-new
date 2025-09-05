import { NextRequest, NextResponse } from "next/server";
import { videoManagementService } from "@/lib/admin/video-management-service";
import { ApiResponse, VideoFilters } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    // Parse filter parameters
    const filters: VideoFilters = {};

    const isActiveParam = searchParams.get("isActive");
    if (isActiveParam !== null) {
      filters.isActive = isActiveParam === "true";
    }

    const positionLevelId = searchParams.get("positionLevelId");
    if (positionLevelId) {
      filters.positionLevelId = positionLevelId;
    }

    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");

    if (dateFromParam) {
      const dateFrom = new Date(dateFromParam);
      if (!isNaN(dateFrom.getTime())) {
        filters.dateFrom = dateFrom;
      }
    }

    if (dateToParam) {
      const dateTo = new Date(dateToParam);
      if (!isNaN(dateTo.getTime())) {
        filters.dateTo = dateTo;
      }
    }

    const searchTerm = searchParams.get("searchTerm");
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pagination parameters",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get videos with filters and pagination
    const result = await videoManagementService.getVideos(filters, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Videos API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch videos",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.url) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and URL are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!body.duration || body.duration <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid duration is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!body.rewardAmount || body.rewardAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid reward amount is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Parse dates if provided
    const videoData = {
      ...body,
      availableFrom: body.availableFrom ? new Date(body.availableFrom) : undefined,
      availableTo: body.availableTo ? new Date(body.availableTo) : undefined,
    };

    // Validate dates
    if (videoData.availableFrom && isNaN(videoData.availableFrom.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid availableFrom date",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (videoData.availableTo && isNaN(videoData.availableTo.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid availableTo date",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Create video
    const video = await videoManagementService.createVideo(videoData);

    return NextResponse.json(
      {
        success: true,
        data: video,
        message: "Video created successfully",
      } as ApiResponse,
      { status: 201 }
    );

  } catch (error) {
    console.error("Create video API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create video",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoIds, ...updateData } = body;

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Video IDs array is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Parse dates if provided
    if (updateData.availableFrom) {
      updateData.availableFrom = new Date(updateData.availableFrom);
      if (isNaN(updateData.availableFrom.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid availableFrom date",
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    if (updateData.availableTo) {
      updateData.availableTo = new Date(updateData.availableTo);
      if (isNaN(updateData.availableTo.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid availableTo date",
          } as ApiResponse,
          { status: 400 }
        );
      }
    }

    // Bulk update videos
    const result = await videoManagementService.bulkUpdateVideos(videoIds, updateData);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Updated ${result.updated} videos successfully`,
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Bulk update videos API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update videos",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
