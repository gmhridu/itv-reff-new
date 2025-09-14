import { NextRequest, NextResponse } from "next/server";
import { sliderManagementService } from "@/lib/admin/slider-management-service";
import { ApiResponse } from "@/types/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Slider image ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const sliderImage = await sliderManagementService.getSliderImageById(id);

    if (!sliderImage) {
      return NextResponse.json(
        {
          success: false,
          error: "Slider image not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: sliderImage,
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Get slider image API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch slider image",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Slider image ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate update data
    if (body.url && typeof body.url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (body.order !== undefined && (typeof body.order !== 'number' || body.order < 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Order must be a non-negative number",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: "isActive must be a boolean",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const updatedSliderImage = await sliderManagementService.updateSliderImage(id, body);

    return NextResponse.json(
      {
        success: true,
        data: updatedSliderImage,
        message: "Slider image updated successfully",
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Update slider image API error:", error);

    const statusCode = error instanceof Error && error.message === "Slider image not found" ? 404 : 500;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update slider image",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: statusCode }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Slider image ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    await sliderManagementService.deleteSliderImage(id);

    return NextResponse.json(
      {
        success: true,
        message: "Slider image deleted successfully",
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Delete slider image API error:", error);

    const statusCode = error instanceof Error && error.message === "Slider image not found" ? 404 : 500;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete slider image",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: statusCode }
    );
  }
}
