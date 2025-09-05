import { NextRequest, NextResponse } from "next/server";
import { analyticsService } from "@/lib/admin/analytics-service";
import { ApiResponse } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    console.log("Analytics API: Starting request");

    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const timePeriod =
      (searchParams.get("timePeriod") as
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly") || "monthly";

    console.log("Analytics API: Query params", {
      dateFromParam,
      dateToParam,
      timePeriod,
    });

    // Parse dates
    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;

    // Validate dates
    if (dateFromParam && isNaN(dateFrom!.getTime())) {
      console.error("Analytics API: Invalid dateFrom parameter", dateFromParam);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid dateFrom parameter",
        } as ApiResponse,
        { status: 400 },
      );
    }

    if (dateToParam && isNaN(dateTo!.getTime())) {
      console.error("Analytics API: Invalid dateTo parameter", dateToParam);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid dateTo parameter",
        } as ApiResponse,
        { status: 400 },
      );
    }

    console.log("Analytics API: Fetching analytics data with params", {
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
      timePeriod,
    });

    // Get analytics data
    const analyticsData = await analyticsService.getAnalyticsData(
      dateFrom,
      dateTo,
      timePeriod,
    );

    console.log("Analytics API: Successfully fetched analytics data", {
      totalRevenue: analyticsData.overview.totalRevenue,
      totalUsers: analyticsData.overview.totalUsers,
      totalVideoViews: analyticsData.overview.totalVideoViews,
      topVideosCount: analyticsData.topVideos.length,
      topUsersCount: analyticsData.topUsers.length,
      revenueBreakdownCount: analyticsData.revenueBreakdown.length,
    });

    return NextResponse.json(
      {
        success: true,
        data: analyticsData,
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Analytics API: Error occurred", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    // Check if it's a Prisma error
    if (error && typeof error === "object" && "code" in error) {
      console.error("Analytics API: Prisma error", {
        code: (error as any).code,
        meta: (error as any).meta,
        clientVersion: (error as any).clientVersion,
      });
    }

    // Return different error messages based on error type
    let errorMessage = "Failed to fetch analytics data";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("Database")) {
        errorMessage = "Database connection error";
        statusCode = 503;
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timeout";
        statusCode = 504;
      } else if (
        error.message.includes("permission") ||
        error.message.includes("access")
      ) {
        errorMessage = "Database access denied";
        statusCode = 403;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      } as ApiResponse,
      { status: statusCode },
    );
  }
}
