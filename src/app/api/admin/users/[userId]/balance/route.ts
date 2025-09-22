import { NextRequest, NextResponse } from "next/server";
import { adminAuthMiddleware } from "@/lib/api/api-auth";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { userManagementService } from "@/lib/admin/user-management-service";
import { z } from "zod";

const updateBalanceSchema = z.object({
  newBalance: z.number().min(0, "Balance must be non-negative"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate admin user
    const admin = await adminAuthMiddleware(request);

    if (!admin) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    const { userId } = params;
    if (!userId) {
      const response = NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 }
      );
      return addAPISecurityHeaders(response);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateBalanceSchema.parse(body);

    // Get client information for audit logging
    const ipAddress = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Update user balance
    const updatedUser = await userManagementService.updateWalletBalance(
      userId,
      validatedData.newBalance,
      validatedData.reason,
      admin.id,
      ipAddress,
      userAgent
    );

    const response = NextResponse.json({
      success: true,
      message: "User balance updated successfully",
      data: {
        userId: updatedUser.id,
        previousBalance: body.previousBalance || 0,
        newBalance: updatedUser.walletBalance,
        reason: validatedData.reason,
        updatedBy: {
          id: admin.id,
          name: admin.name,
        },
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Update balance API error:", error);

    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
      return addAPISecurityHeaders(response);
    }

    let errorMessage = "Failed to update user balance";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        errorMessage = "User not found";
        statusCode = 404;
      } else {
        errorMessage = error.message;
      }
    }

    const response = NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );

    return addAPISecurityHeaders(response);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate admin user
    const admin = await adminAuthMiddleware(request);

    if (!admin) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    const { userId } = params;
    if (!userId) {
      const response = NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 }
      );
      return addAPISecurityHeaders(response);
    }

    // Get user details
    const user = await userManagementService.getUserById(userId);

    if (!user) {
      const response = NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
      return addAPISecurityHeaders(response);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        currentBalance: user.walletBalance,
        totalEarnings: user.totalEarnings,
        isIntern: user.isIntern,
        status: user.status,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Get user balance API error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve user balance information",
      },
      { status: 500 }
    );

    return addAPISecurityHeaders(response);
  }
}
