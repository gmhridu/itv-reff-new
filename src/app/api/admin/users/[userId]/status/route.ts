import { NextRequest, NextResponse } from "next/server";
import { userManagementService } from "@/lib/admin/user-management-service";
import { ApiResponse, UserStatus } from "@/types/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await req.json();
    const { status, adminNotes } = body;

    console.log("User status update API: Starting request", {
      userId,
      status,
      hasAdminNotes: !!adminNotes,
    });

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: "Status is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate status
    if (!Object.values(UserStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user status",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await userManagementService.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Update user status
    const updatedUser = await userManagementService.updateUserStatus(
      userId,
      status,
      adminNotes
    );

    console.log("User status update API: Successfully updated user status", {
      userId,
      previousStatus: existingUser.status,
      newStatus: status,
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedUser,
        message: `User status updated to ${status}`,
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("User status update API: Error occurred", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user status",
        message:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      } as ApiResponse,
      { status: 500 }
    );
  }
}
