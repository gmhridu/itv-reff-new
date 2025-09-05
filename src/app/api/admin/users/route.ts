import { NextRequest, NextResponse } from "next/server";
import { userManagementService } from "@/lib/admin/user-management-service";
import { ApiResponse, UserFilters, UserStatus } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    // Parse filter parameters
    const filters: UserFilters = {};

    const status = searchParams.get("status") as UserStatus;
    if (status && Object.values(UserStatus).includes(status)) {
      filters.status = status;
    }

    const positionLevel = searchParams.get("positionLevel");
    if (positionLevel) {
      filters.positionLevel = positionLevel;
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

    const isInternParam = searchParams.get("isIntern");
    if (isInternParam !== null) {
      filters.isIntern = isInternParam === "true";
    }

    const hasReferralsParam = searchParams.get("hasReferrals");
    if (hasReferralsParam === "true") {
      filters.hasReferrals = true;
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

    // Get users with filters and pagination
    const result = await userManagementService.getUsers(filters, {
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
    console.error("Users API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate status if provided
    if (updateData.status && !Object.values(UserStatus).includes(updateData.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user status",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await userManagementService.updateUser(userId, updateData);

    return NextResponse.json(
      {
        success: true,
        data: updatedUser,
        message: "User updated successfully",
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Update user API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
