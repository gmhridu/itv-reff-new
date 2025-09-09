import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";

// GET - Fetch single withdrawal request details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let response: NextResponse;

  try {
    const { id } = params;

    if (!id) {
      response = NextResponse.json(
        { error: "Withdrawal request ID is required" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Fetch withdrawal request with user details
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            walletBalance: true,
            commissionBalance: true,
            totalEarnings: true,
            createdAt: true,
            referralCode: true,
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

    // Get related transactions
    const relatedTransactions = await prisma.walletTransaction.findMany({
      where: {
        OR: [
          { referenceId: withdrawalRequest.id },
          { referenceId: `refund-${withdrawalRequest.id}` },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get user's withdrawal history (last 5)
    const withdrawalHistory = await prisma.withdrawalRequest.findMany({
      where: {
        userId: withdrawalRequest.userId,
        id: { not: withdrawalRequest.id },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Get activity logs related to this withdrawal
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        OR: [
          {
            activity: "withdrawal_request",
            metadata: {
              contains: `"withdrawalRequestId":"${withdrawalRequest.id}"`,
            },
          },
          {
            activity: "withdrawal_status_updated",
            metadata: {
              contains: `"withdrawalRequestId":"${withdrawalRequest.id}"`,
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    response = NextResponse.json({
      success: true,
      data: {
        withdrawalRequest: {
          ...withdrawalRequest,
          paymentDetails,
        },
        relatedTransactions,
        withdrawalHistory,
        activityLogs: activityLogs.map((log) => ({
          ...log,
          metadata:
            typeof log.metadata === "string"
              ? JSON.parse(log.metadata)
              : log.metadata,
        })),
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error fetching withdrawal request details:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// DELETE - Delete withdrawal request (only if pending)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let response: NextResponse;

  try {
    const { id } = params;

    if (!id) {
      response = NextResponse.json(
        { error: "Withdrawal request ID is required" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
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

    // Only allow deletion of pending requests
    if (withdrawalRequest.status !== "PENDING") {
      response = NextResponse.json(
        { error: "Only pending withdrawal requests can be deleted" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Parse payment details to get refund amount
    const paymentDetails =
      typeof withdrawalRequest.paymentDetails === "string"
        ? JSON.parse(withdrawalRequest.paymentDetails)
        : withdrawalRequest.paymentDetails;

    const refundAmount =
      withdrawalRequest.amount + (paymentDetails.handlingFee || 0);
    const walletType = paymentDetails.walletType;

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Refund the amount
      if (walletType === "Main Wallet") {
        await tx.user.update({
          where: { id: withdrawalRequest.userId },
          data: {
            walletBalance: {
              increment: refundAmount,
            },
          },
        });
      } else if (walletType === "Commission Wallet") {
        await tx.user.update({
          where: { id: withdrawalRequest.userId },
          data: {
            commissionBalance: {
              increment: refundAmount,
            },
          },
        });
      }

      // Create refund transaction
      await tx.walletTransaction.create({
        data: {
          userId: withdrawalRequest.userId,
          type: "CREDIT",
          amount: refundAmount,
          balanceAfter:
            walletType === "Main Wallet"
              ? withdrawalRequest.user.walletBalance + refundAmount
              : withdrawalRequest.user.commissionBalance + refundAmount,
          description: `Withdrawal request deleted - refund processed`,
          referenceId: `delete-refund-${withdrawalRequest.id}`,
          status: "COMPLETED",
          metadata: JSON.stringify({
            originalWithdrawalId: withdrawalRequest.id,
            refundReason: "Withdrawal request deleted by admin",
            walletType,
            originalAmount: withdrawalRequest.amount,
            handlingFee: paymentDetails.handlingFee || 0,
          }),
        },
      });

      // Delete related transactions
      await tx.walletTransaction.deleteMany({
        where: {
          referenceId: withdrawalRequest.id,
        },
      });

      // Delete the withdrawal request
      await tx.withdrawalRequest.delete({
        where: { id },
      });

      // Log the admin action
      await tx.activityLog.create({
        data: {
          userId: withdrawalRequest.userId,
          activity: "withdrawal_deleted",
          description: `Admin deleted withdrawal request and processed refund`,
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          metadata: JSON.stringify({
            withdrawalRequestId: withdrawalRequest.id,
            refundAmount,
            walletType,
            originalAmount: withdrawalRequest.amount,
            handlingFee: paymentDetails.handlingFee || 0,
          }),
        },
      });
    });

    response = NextResponse.json({
      success: true,
      message: "Withdrawal request deleted and refund processed successfully",
      data: {
        refundAmount,
        walletType,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error deleting withdrawal request:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
