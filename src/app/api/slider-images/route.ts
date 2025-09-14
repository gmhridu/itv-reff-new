import { NextRequest, NextResponse } from "next/server";
import { sliderManagementService } from "@/lib/admin/slider-management-service";
import { ApiResponse } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    // Get all active slider images for frontend display
    const sliderImages = await sliderManagementService.getActiveSliderImages();

    return NextResponse.json(
      {
        success: true,
        data: sliderImages,
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Frontend slider images API error:", error);

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
