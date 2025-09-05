import { NextRequest, NextResponse } from "next/server";
import { userManagementService } from "@/lib/admin/user-management-service";
import { ApiResponse, UserStatus } from "@/types/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const user = await userManagementService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Get user API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await req.json();

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
    if (body.status && !Object.values(UserStatus).includes(body.status)) {
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

    // Update user
    const updatedUser = await userManagementService.updateUser(userId, body);

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
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

    // Instead of hard delete, set user status to BANNED
    const bannedUser = await userManagementService.updateUserStatus(
      userId,
      UserStatus.BANNED,
      "Account deleted by admin"
    );

    return NextResponse.json(
      {
        success: true,
        data: bannedUser,
        message: "User account has been banned",
      } as ApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error("Delete user API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
