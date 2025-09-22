import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db as prisma } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";

// Interface for security refund request
interface SecurityRefundRequest {
  id: string;
  userId: string;
  fromLevel: number;
  toLevel: number;
  refundAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestNote?: string;
  adminNotes?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    const user = await authMiddleware(request);
    if (!user) {
      response = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get user's basic info
    const userWithDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        currentPositionId: true,
        userPlan: {
          where: { status: "ACTIVE" },
          include: { plan: true },
        },
      },
    });

    if (!userWithDetails) {
      response = NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get current position if user has one
    let currentPosition: any = null;
    if (userWithDetails.currentPositionId) {
      try {
        currentPosition = await prisma.positionLevel.findUnique({
          where: { id: userWithDetails.currentPositionId },
        });
      } catch (error) {
        console.warn("Position level not found:", error);
      }
    }

    // Get security refund requests
    let securityRefundRequests: SecurityRefundRequest[] = [];
    try {
      const requests = await (prisma as any).securityRefundRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      securityRefundRequests = requests || [];
    } catch (error) {
      console.warn("Security refund requests not available:", error);
      securityRefundRequests = [];
    }

    // Check if user has upgraded (has a position above Intern)
    const hasUpgraded =
      currentPosition &&
      currentPosition.name !== "Intern" &&
      currentPosition.level > 0;

    // Get previous level info if upgraded
    let previousLevelDeposit = 0;
    let canRequestRefund = false;

    if (hasUpgraded && currentPosition) {
      const currentLevel = currentPosition.level;
      const previousLevel = currentLevel - 1;

      if (previousLevel > 0) {
        // Get the previous level plan details
        try {
          const previousPlan = await prisma.plan.findFirst({
            where: {
              OR: [
                { name: { contains: `L${previousLevel}` } },
                { name: { contains: `Level ${previousLevel}` } },
                { name: `L${previousLevel}` },
              ],
            },
          });

          if (previousPlan) {
            previousLevelDeposit = previousPlan.price;
          }
        } catch (error) {
          console.warn("Previous plan not found:", error);
        }

        // Check if user hasn't already got refund for this level
        const existingRefund = securityRefundRequests.find(
          (req) => req.fromLevel === previousLevel && req.status === "APPROVED",
        );

        const pendingRefund = securityRefundRequests.find(
          (req) => req.fromLevel === previousLevel && req.status === "PENDING",
        );

        canRequestRefund = !existingRefund && !pendingRefund;
      }
    }

    response = NextResponse.json({
      success: true,
      data: {
        hasUpgraded: hasUpgraded || false,
        canRequestRefund: canRequestRefund || false,
        currentLevel: currentPosition?.level || 0,
        currentLevelName: currentPosition?.name || "Intern",
        previousLevelDeposit: previousLevelDeposit || 0,
        securityDeposited: userWithDetails.userPlan?.[0]?.amountPaid || 0,
        refundRequests: securityRefundRequests,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error fetching security refund data:", error);
    response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

export async function POST(request: NextRequest) {
  let response: NextResponse;

  try {
    const user = await authMiddleware(request);
    if (!user) {
      response = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get user's basic info
    const userWithDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        currentPositionId: true,
        userPlan: {
          where: { status: "ACTIVE" },
          include: { plan: true },
        },
      },
    });

    if (!userWithDetails || !userWithDetails.currentPositionId) {
      response = NextResponse.json(
        { success: false, error: "User position not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get current position
    const currentPosition = await prisma.positionLevel.findUnique({
      where: { id: userWithDetails.currentPositionId },
    });

    if (!currentPosition) {
      response = NextResponse.json(
        { success: false, error: "Current position not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    // Check if user has upgraded
    const hasUpgraded =
      currentPosition.name !== "Intern" && currentPosition.level > 0;

    if (!hasUpgraded) {
      response = NextResponse.json(
        {
          success: false,
          error: "You are not eligible to refund your security",
        },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    const currentLevel = currentPosition.level;
    const previousLevel = currentLevel - 1;

    if (previousLevel <= 0) {
      response = NextResponse.json(
        { success: false, error: "No previous level found for refund" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Check for existing refund requests
    let existingRefundRequests: SecurityRefundRequest[] = [];
    try {
      const requests = await (prisma as any).securityRefundRequest.findMany({
        where: {
          userId: user.id,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });
      existingRefundRequests = requests || [];
    } catch (error) {
      console.warn("Error checking existing refund requests:", error);
    }

    // Check for existing refund request for this level
    const existingRequest = existingRefundRequests.find(
      (req) => req.fromLevel === previousLevel,
    );

    if (existingRequest) {
      const statusMessage =
        existingRequest.status === "APPROVED"
          ? "You have already received refund for this level"
          : "You already have a pending refund request for this level";

      response = NextResponse.json(
        { success: false, error: statusMessage },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get previous level plan details
    const previousPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { name: { contains: `L${previousLevel}` } },
          { name: { contains: `Level ${previousLevel}` } },
          { name: `L${previousLevel}` },
        ],
      },
    });

    if (!previousPlan) {
      response = NextResponse.json(
        { success: false, error: "Previous level plan not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    // Create refund request
    let refundRequest: any = null;
    try {
      refundRequest = await (prisma as any).securityRefundRequest.create({
        data: {
          userId: user.id,
          fromLevel: previousLevel,
          toLevel: currentLevel,
          refundAmount: previousPlan.price,
          status: "PENDING",
          requestNote: `Security deposit refund request from Level ${previousLevel} to Level ${currentLevel}`,
        },
      });
    } catch (error) {
      console.error("Error creating refund request:", error);
      response = NextResponse.json(
        { success: false, error: "Failed to create refund request" },
        { status: 500 },
      );
      return addAPISecurityHeaders(response);
    }

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          activity: "security_refund_request",
          description: `Requested security refund of ${previousPlan.price} PKR from Level ${previousLevel}`,
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          metadata: JSON.stringify({
            refundRequestId: refundRequest?.id,
            fromLevel: previousLevel,
            toLevel: currentLevel,
            refundAmount: previousPlan.price,
          }),
        },
      });
    } catch (error) {
      console.warn("Failed to log activity:", error);
    }

    response = NextResponse.json({
      success: true,
      message: "Security refund request submitted successfully",
      data: refundRequest,
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error creating security refund request:", error);
    response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
