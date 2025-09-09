import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { UserNotificationService } from "@/lib/user-notification-service";

// GET - Fetch withdrawal requests with filters and pagination
export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const paymentMethod = searchParams.get("paymentMethod");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (
      status &&
      ["PENDING", "APPROVED", "REJECTED", "PROCESSED"].includes(status)
    ) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount);
      }
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    // Search in user details
    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            phone: {
              contains: search,
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Fetch withdrawal requests with user details
    const [withdrawalRequests, totalCount] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              walletBalance: true,
              commissionBalance: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    // Parse payment details for each request
    const processedRequests = withdrawalRequests.map((request) => ({
      ...request,
      paymentDetails:
        typeof request.paymentDetails === "string"
          ? JSON.parse(request.paymentDetails)
          : request.paymentDetails,
    }));

    // Calculate statistics
    const stats = await prisma.withdrawalRequest.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
      _sum: {
        amount: true,
      },
    });

    const statistics = {
      total: totalCount,
      pending: stats.find((s) => s.status === "PENDING")?._count?.status || 0,
      approved: stats.find((s) => s.status === "APPROVED")?._count?.status || 0,
      rejected: stats.find((s) => s.status === "REJECTED")?._count?.status || 0,
      processed:
        stats.find((s) => s.status === "PROCESSED")?._count?.status || 0,
      totalAmount: stats.reduce((sum, s) => sum + (s._sum?.amount || 0), 0),
      pendingAmount:
        stats.find((s) => s.status === "PENDING")?._sum?.amount || 0,
    };

    response = NextResponse.json({
      success: true,
      data: {
        withdrawalRequests: processedRequests,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        statistics,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// PATCH - Update withdrawal request status
export async function PATCH(request: NextRequest) {
  let response: NextResponse;

  try {
    const body = await request.json();
    const { withdrawalRequestId, status, adminNotes, transactionId } = body;

    // Validate required fields
    if (!withdrawalRequestId || !status) {
      response = NextResponse.json(
        { error: "Withdrawal request ID and status are required" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Validate status
    if (!["PENDING", "APPROVED", "REJECTED", "PROCESSED"].includes(status)) {
      response = NextResponse.json(
        { error: "Invalid status" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get the withdrawal request with user details
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalRequestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            walletBalance: true,
            commissionBalance: true,
          },
        },
      },
    });

    if (!withdrawalRequest) {
      response = NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    // Parse payment details
    const paymentDetails =
      typeof withdrawalRequest.paymentDetails === "string"
        ? JSON.parse(withdrawalRequest.paymentDetails)
        : withdrawalRequest.paymentDetails;

    // Handle status-specific logic
    let updateData: any = {
      status,
      adminNotes: adminNotes || null,
      processedAt: status === "PROCESSED" ? new Date() : null,
      transactionId: transactionId || null,
    };

    // If rejected, refund the amount to user's wallet
    if (status === "REJECTED" && withdrawalRequest.status === "PENDING") {
      const refundAmount =
        withdrawalRequest.amount + (paymentDetails.handlingFee || 0);
      const walletType = paymentDetails.walletType;

      if (walletType === "Main Wallet") {
        await prisma.user.update({
          where: { id: withdrawalRequest.userId },
          data: {
            walletBalance: {
              increment: refundAmount,
            },
          },
        });

        // Create refund transaction
        await prisma.walletTransaction.create({
          data: {
            userId: withdrawalRequest.userId,
            type: "CREDIT",
            amount: refundAmount,
            balanceAfter: withdrawalRequest.user.walletBalance + refundAmount,
            description: `Withdrawal refund - ${withdrawalRequest.paymentMethod} (Request rejected)`,
            referenceId: `refund-${withdrawalRequestId}`,
            status: "COMPLETED",
            metadata: JSON.stringify({
              originalWithdrawalId: withdrawalRequestId,
              refundReason: "Withdrawal request rejected",
              walletType,
              originalAmount: withdrawalRequest.amount,
              handlingFee: paymentDetails.handlingFee || 0,
            }),
          },
        });
      } else if (walletType === "Commission Wallet") {
        await prisma.user.update({
          where: { id: withdrawalRequest.userId },
          data: {
            commissionBalance: {
              increment: refundAmount,
            },
          },
        });

        // Create refund transaction
        await prisma.walletTransaction.create({
          data: {
            userId: withdrawalRequest.userId,
            type: "CREDIT",
            amount: refundAmount,
            balanceAfter:
              withdrawalRequest.user.commissionBalance + refundAmount,
            description: `Withdrawal refund - ${withdrawalRequest.paymentMethod} (Request rejected)`,
            referenceId: `refund-${withdrawalRequestId}`,
            status: "COMPLETED",
            metadata: JSON.stringify({
              originalWithdrawalId: withdrawalRequestId,
              refundReason: "Withdrawal request rejected",
              walletType,
              originalAmount: withdrawalRequest.amount,
              handlingFee: paymentDetails.handlingFee || 0,
            }),
          },
        });
      }
    }

    // Update withdrawal request
    const updatedRequest = await prisma.withdrawalRequest.update({
      where: { id: withdrawalRequestId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Log the admin action
    await prisma.activityLog.create({
      data: {
        userId: withdrawalRequest.userId,
        activity: "withdrawal_status_updated",
        description: `Admin updated withdrawal request status to ${status}`,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        metadata: JSON.stringify({
          withdrawalRequestId,
          oldStatus: withdrawalRequest.status,
          newStatus: status,
          adminNotes,
          transactionId,
        }),
      },
    });

    // Create user notification about status update
    try {
      await UserNotificationService.notifyWithdrawalStatusChange(
        withdrawalRequest.userId,
        status,
        withdrawalRequest.amount,
        transactionId,
        adminNotes,
      );
    } catch (notificationError) {
      console.error("Failed to create user notification:", notificationError);
      // Don't fail the request if notification fails
    }

    response = NextResponse.json({
      success: true,
      message: `Withdrawal request ${status.toLowerCase()} successfully`,
      data: {
        ...updatedRequest,
        paymentDetails:
          typeof updatedRequest.paymentDetails === "string"
            ? JSON.parse(updatedRequest.paymentDetails)
            : updatedRequest.paymentDetails,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error updating withdrawal request:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
