import { NextResponse } from "next/server";
import { userManagementService } from "@/lib/admin/user-management-service";
import { ApiResponse } from "@/types/admin";

export async function GET() {
  try {
    console.log("User statistics API: Starting request");

    const statistics = await userManagementService.getUserStatistics();

    console.log("User statistics API: Successfully fetched statistics", {
      totalUsers: statistics.totalUsers,
      activeUsers: statistics.activeUsers,
      averageBalance: statistics.averageBalance,
      totalEarnings: statistics.totalEarnings,
    });

    return NextResponse.json(
      {
        success: true,
        data: statistics,
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("User statistics API: Error occurred", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user statistics",
        message:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      } as ApiResponse,
      { status: 500 },
    );
  }
}
