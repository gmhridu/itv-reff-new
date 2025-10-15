import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db } from "@/lib/db";
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
    const userWithDetails = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        currentPositionId: true,
        depositPaid: true,
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
        currentPosition = await db.positionLevel.findUnique({
          where: { id: userWithDetails.currentPositionId },
        });
      } catch (error) {
        console.warn("Position level not found:", error);
      }
    }

    // Get security refund requests
    let securityRefundRequests: SecurityRefundRequest[] = [];
    try {
      const requests = await db.securityRefundRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      // Convert null values to undefined to match interface
      securityRefundRequests = (requests || []).map(request => ({
        ...request,
        requestNote: request.requestNote ?? undefined,
        adminNotes: request.adminNotes ?? undefined,
        processedAt: request.processedAt ?? undefined,
      }));
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
        // Get the previous level position details
        try {
          const previousPositionLevel = await db.positionLevel.findUnique({
            where: { level: previousLevel },
          });

          if (previousPositionLevel) {
            previousLevelDeposit = previousPositionLevel.deposit;
          }
        } catch (error) {
          console.warn("Previous position level not found:", error);
        }

        // Check if user hasn't already got refund for this level
        const existingRefund = securityRefundRequests.find(
          (req) => req.fromLevel === previousLevel && req.status === "APPROVED",
        );

        const pendingRefund = securityRefundRequests.find(
          (req) => req.fromLevel === previousLevel && req.status === "PENDING",
        );

        // NEW VALIDATION: Prevent refunds for direct upgrades from Intern
        // Users who upgraded directly from Intern to any level cannot get refunds
        // They must upgrade at least once more to be eligible for refunds
        const hasUpgradedBeyondInitialLevel = securityRefundRequests.some(
          (req) => req.status === "APPROVED"
        );

        canRequestRefund = !existingRefund && !pendingRefund && hasUpgradedBeyondInitialLevel;
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
        securityDeposited: userWithDetails.depositPaid || 0,
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
    const userWithDetails = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        currentPositionId: true,
        depositPaid: true,
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
    const currentPosition = await db.positionLevel.findUnique({
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
      const requests = await db.securityRefundRequest.findMany({
        where: {
          userId: user.id,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });
      // Convert null values to undefined to match interface
      existingRefundRequests = (requests || []).map(request => ({
        ...request,
        requestNote: request.requestNote ?? undefined,
        adminNotes: request.adminNotes ?? undefined,
        processedAt: request.processedAt ?? undefined,
      }));
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

    // NEW VALIDATION: Prevent refunds for direct upgrades from Intern
    // Users who upgraded directly from Intern to any level cannot get refunds
    // They must upgrade at least once more to be eligible for refunds
    const hasUpgradedBeyondInitialLevel = existingRefundRequests.some(
      (req) => req.status === "APPROVED"
    );

    if (!hasUpgradedBeyondInitialLevel) {
      response = NextResponse.json(
        {
          success: false,
          error: "You are not eligible for security refund. You must upgrade at least once more after your initial position purchase to be eligible for refunds.",
        },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get previous level position details
    const previousPositionLevel = await db.positionLevel.findUnique({
      where: { level: previousLevel },
    });

    if (!previousPositionLevel) {
      response = NextResponse.json(
        { success: false, error: "Previous level position not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    // Create refund request
    let refundRequest: any = null;
    try {
      refundRequest = await db.securityRefundRequest.create({
        data: {
          userId: user.id,
          fromLevel: previousLevel,
          toLevel: currentLevel,
          refundAmount: previousPositionLevel.deposit,
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
      await db.activityLog.create({
        data: {
          userId: user.id,
          activity: "security_refund_request",
          description: `Requested security refund of ${previousPositionLevel.deposit} PKR from Level ${previousLevel}`,
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          metadata: JSON.stringify({
            refundRequestId: refundRequest?.id,
            fromLevel: previousLevel,
            toLevel: currentLevel,
            refundAmount: previousPositionLevel.deposit,
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
