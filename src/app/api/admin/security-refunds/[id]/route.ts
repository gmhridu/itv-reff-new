import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/security-refunds/[id] - Process security refund (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getAdminSession();

    if (
      !session?.user?.role ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action, adminNotes, refundMethod } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 },
      );
    }

    // Find the security refund request
    const securityRefund = await (
      prisma as any
    ).securityRefundRequest.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!securityRefund) {
      return NextResponse.json(
        { success: false, error: "Security refund request not found" },
        { status: 404 },
      );
    }

    if (securityRefund.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Security refund request already processed" },
        { status: 400 },
      );
    }

    const updateData: any = {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      processedAt: new Date(),
      adminNotes: adminNotes || null,
    };

    // Update the security refund request
    const updatedRefund = await (prisma as any).securityRefundRequest.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
      },
    });

    // If approved, process the refund
    if (action === "approve") {
      try {
        // Get current user balance and security deposited
        const currentUser = await prisma.user.findUnique({
          where: { id: securityRefund.userId },
          select: { walletBalance: true, depositPaid: true },
        });

        if (!currentUser) {
          throw new Error("User not found");
        }

        // Check if user has enough security deposited
        if (currentUser.depositPaid < securityRefund.refundAmount) {
          throw new Error("Insufficient security deposit for refund");
        }

        const newSecurityDeposited =
          currentUser.depositPaid - securityRefund.refundAmount;

        // Deduct from Security Deposited and add to Security Refund field
        await prisma.user.update({
          where: { id: securityRefund.userId },
          data: {
            depositPaid: {
              decrement: securityRefund.refundAmount, // Deduct from Security Deposited
            },
            securityRefund: {
              increment: securityRefund.refundAmount, // Add to Security Refund field for withdrawal
            },
          },
        });

        // Create wallet transaction record (for audit purposes only)
        try {
          await prisma.walletTransaction.create({
            data: {
              userId: securityRefund.userId,
              type: "SECURITY_REFUND",
              amount: securityRefund.refundAmount,
              balanceAfter: currentUser.walletBalance, // No change to current balance
              description: `Security refund - Level downgrade (${securityRefund.fromLevel} → ${securityRefund.toLevel}) - Available for withdrawal`,
              status: "COMPLETED",
              referenceId: `SEC_REF_${id}`,
              metadata: JSON.stringify({
                refundId: id,
                fromLevel: securityRefund.fromLevel,
                toLevel: securityRefund.toLevel,
                processedBy: session.user.id,
                deductedFromSecurityDeposit: securityRefund.refundAmount,
                addedToSecurityRefund: securityRefund.refundAmount, // Added to securityRefund field
                addedToCurrentBalance: 0, // No addition to current balance
                addedToWithdrawal: true, // Security refund added to withdrawal availability
                newSecurityDeposited: newSecurityDeposited,
              }),
            },
          });
        } catch (transactionError) {
          console.warn("Wallet transaction creation failed:", transactionError);
          // Continue without failing the entire refund process
        }

        // Log successful refund processing
        console.log(
          `Security refund approved: ${id} for user ${securityRefund.userId}, amount: ${securityRefund.refundAmount}`,
        );
      } catch (refundProcessError) {
        console.error("Error processing refund:", refundProcessError);
        // Revert status if refund processing fails
        await (prisma as any).securityRefundRequest.update({
          where: { id },
          data: { status: "PENDING" },
        });

        return NextResponse.json(
          { success: false, error: "Failed to process refund" },
          { status: 500 },
        );
      }
    } else {
      // Log rejected refund
      console.log(
        `Security refund rejected: ${id} for user ${securityRefund.userId}, reason: ${adminNotes || "No reason provided"}`,
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        securityRefund: {
          id: updatedRefund.id,
          status: updatedRefund.status,
          processedAt: updatedRefund.processedAt?.toISOString(),
          adminNotes: updatedRefund.adminNotes,
        },
      },
      message: `Security refund request ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("Error processing security refund:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/admin/security-refunds/[id] - Get specific security refund details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getAdminSession();

    if (
      !session?.user?.role ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = params;

    const securityRefund = await (
      prisma as any
    ).securityRefundRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!securityRefund) {
      return NextResponse.json(
        { success: false, error: "Security refund request not found" },
        { status: 404 },
      );
    }

    const formattedRefund = {
      id: securityRefund.id,
      userId: securityRefund.userId,
      userName: securityRefund.user.name,
      userEmail: securityRefund.user.email,
      userPhone: securityRefund.user.phone,
      amount: securityRefund.refundAmount,
      reason: `Level downgrade refund (${securityRefund.fromLevel} → ${securityRefund.toLevel})`,
      description:
        securityRefund.requestNote ||
        "Security refund request for level downgrade",
      status: securityRefund.status,
      securityType: "TECHNICAL_ERROR",
      evidence: [],
      createdAt: securityRefund.createdAt.toISOString(),
      updatedAt: securityRefund.updatedAt.toISOString(),
      processedBy: null,
      processedAt: securityRefund.processedAt?.toISOString(),
      refundMethod: "WALLET",
      originalTransactionId: null,
      adminNotes: securityRefund.adminNotes,
      fromLevel: securityRefund.fromLevel,
      toLevel: securityRefund.toLevel,
    };

    return NextResponse.json({
      success: true,
      data: { securityRefund: formattedRefund },
    });
  } catch (error) {
    console.error("Error fetching security refund:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/security-refunds/[id] - Delete security refund request (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getAdminSession();

    if (!session?.user?.role || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Super admin required" },
        { status: 401 },
      );
    }

    const { id } = params;

    const securityRefund = await (
      prisma as any
    ).securityRefundRequest.findUnique({
      where: { id },
    });

    if (!securityRefund) {
      return NextResponse.json(
        { success: false, error: "Security refund request not found" },
        { status: 404 },
      );
    }

    if (securityRefund.status === "APPROVED") {
      return NextResponse.json(
        { success: false, error: "Cannot delete approved refund requests" },
        { status: 400 },
      );
    }

    await (prisma as any).securityRefundRequest.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Security refund request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting security refund request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
