import { NextRequest, NextResponse } from "next/server";
import { sliderManagementService } from "@/lib/admin/slider-management-service";
import { ApiResponse, SliderImageFilters } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "order";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

    // Parse filter parameters
    const filters: SliderImageFilters = {};

    const isActiveParam = searchParams.get("isActive");
    if (isActiveParam !== null) {
      filters.isActive = isActiveParam === "true";
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

    // Get slider images with filters and pagination
    const result = await sliderManagementService.getSliderImages(filters, {
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
    console.error("Slider images API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch slider images",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle multiple images upload
    if (Array.isArray(body)) {
      // Validate that we don't exceed 5 images
      if (body.length > 5) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum 5 images can be uploaded at once",
          } as ApiResponse,
          { status: 400 }
        );
      }

      // Validate each image data
      for (const imageData of body) {
        if (!imageData.url || typeof imageData.url !== 'string') {
          return NextResponse.json(
            {
              success: false,
              error: "Each image must have a valid URL",
            } as ApiResponse,
            { status: 400 }
          );
        }
      }

      // Create multiple slider images
      const sliderImages = await sliderManagementService.createMultipleSliderImages(body);

      return NextResponse.json(
        {
          success: true,
          data: sliderImages,
          message: `Successfully created ${sliderImages.length} slider images`,
        } as ApiResponse,
        { status: 201 }
      );
    }

    // Handle single image upload
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: "Image URL is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Create single slider image
    const sliderImage = await sliderManagementService.createSliderImage(body);

    return NextResponse.json(
      {
        success: true,
        data: sliderImage,
        message: "Slider image created successfully",
      } as ApiResponse,
      { status: 201 }
    );

  } catch (error) {
    console.error("Create slider image API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create slider image",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle bulk order update
    if (body.orderUpdates && Array.isArray(body.orderUpdates)) {
      // Validate order updates
      for (const update of body.orderUpdates) {
        if (!update.id || typeof update.order !== 'number') {
          return NextResponse.json(
            {
              success: false,
              error: "Each order update must have an id and order number",
            } as ApiResponse,
            { status: 400 }
          );
        }
      }

      await sliderManagementService.updateSliderImagesOrder(body.orderUpdates);

      return NextResponse.json(
        {
          success: true,
          message: "Slider images order updated successfully",
        } as ApiResponse,
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid bulk update request",
      } as ApiResponse,
      { status: 400 }
    );

  } catch (error) {
    console.error("Bulk update slider images API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update slider images",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle multiple deletions
    if (body.ids && Array.isArray(body.ids)) {
      if (body.ids.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No slider image IDs provided",
          } as ApiResponse,
          { status: 400 }
        );
      }

      await sliderManagementService.deleteMultipleSliderImages(body.ids);

      return NextResponse.json(
        {
          success: true,
          message: `Successfully deleted ${body.ids.length} slider images`,
        } as ApiResponse,
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid delete request",
      } as ApiResponse,
      { status: 400 }
    );

  } catch (error) {
    console.error("Delete slider images API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete slider images",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
