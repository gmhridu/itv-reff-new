import { NextRequest, NextResponse } from "next/server";
import { videoManagementService } from "@/lib/admin/video-management-service";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { ApiResponse } from "@/types/admin";

// GET single video by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Video ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const video = await videoManagementService.getVideoById(videoId);

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          error: "Video not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: video,
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Get video API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch video",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// UPDATE video by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;
    const body = await req.json();

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Video ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate required fields if provided
    if (body.title !== undefined && !body.title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Title cannot be empty",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (body.rewardAmount !== undefined && body.rewardAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Reward amount must be greater than 0",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (body.duration !== undefined && body.duration <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Duration must be greater than 0",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Parse dates if provided
    const updateData = { ...body };

    if (body.availableFrom) {
      updateData.availableFrom = new Date(body.availableFrom);
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

    if (body.availableTo) {
      updateData.availableTo = new Date(body.availableTo);
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

    // Parse tags if provided
    if (body.tags && typeof body.tags === 'string') {
      updateData.tags = body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }

    const updatedVideo = await videoManagementService.updateVideo(videoId, updateData);

    return NextResponse.json(
      {
        success: true,
        data: updatedVideo,
        message: "Video updated successfully",
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Update video API error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Video not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update video",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE video by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Video ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get video details before deletion to clean up Cloudinary resources
    const video = await videoManagementService.getVideoById(videoId);

    if (!video) {
      return NextResponse.json(
        {
          success: false,
          error: "Video not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Delete video from database
    const deleted = await videoManagementService.deleteVideo(videoId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete video",
        } as ApiResponse,
        { status: 500 }
      );
    }

    // Clean up Cloudinary resources if it was a file upload
    if (video.uploadMethod === 'file' && video.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(video.cloudinaryPublicId, 'video');

        // Also delete thumbnail if it was uploaded separately
        if (video.thumbnailUrl && video.thumbnailUrl.includes('cloudinary')) {
          // Extract public ID from thumbnail URL if possible
          const thumbnailPublicIdMatch = video.thumbnailUrl.match(/\/([^\/]+)\.[^.]+$/);
          if (thumbnailPublicIdMatch) {
            await deleteFromCloudinary(`itv-thumbnails/${thumbnailPublicIdMatch[1]}`, 'image');
          }
        }
      } catch (cloudinaryError) {
        console.error("Failed to delete Cloudinary resources:", cloudinaryError);
        // Don't fail the request if Cloudinary cleanup fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Video deleted successfully",
        data: { videoId, deleted: true },
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Delete video API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete video",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// PATCH video status toggle
export async function PATCH(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;
    const body = await req.json();
    const { action } = body;

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Video ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (action === "toggle-status") {
      const updatedVideo = await videoManagementService.toggleVideoStatus(videoId);

      return NextResponse.json(
        {
          success: true,
          data: updatedVideo,
          message: `Video ${updatedVideo.isActive ? 'activated' : 'deactivated'} successfully`,
        } as ApiResponse,
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action. Supported actions: toggle-status",
      } as ApiResponse,
      { status: 400 }
    );

  } catch (error) {
    console.error("Patch video API error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Video not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update video status",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
