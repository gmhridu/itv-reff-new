import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getAdminSession();
    const { id } = params;

    if (
      !session?.user?.role ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      console.error("Admin topup request access denied", {
        hasSession: !!session,
        userId: session?.user?.id,
        userRole: session?.user?.role,
        requestedId: id,
      });
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const topupRequest = await prisma.topupRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            walletBalance: true,
            totalEarnings: true,
          },
        },
        selectedWallet: {
          select: {
            id: true,
            walletType: true,
            walletNumber: true,
            walletHolderName: true,
          },
        },
      },
    });

    if (!topupRequest) {
      console.error(`Topup request not found: ${id}`);
      return NextResponse.json(
        { success: false, error: "Topup request not found" },
        { status: 404 },
      );
    }

    console.log("Topup request found:", {
      requestId: topupRequest.id,
      userId: topupRequest.userId,
      userName: topupRequest.user?.name,
      userPhone: topupRequest.user?.phone,
      amount: topupRequest.amount,
      status: topupRequest.status,
      hasPaymentProof: !!topupRequest.paymentProof,
    });

    return NextResponse.json({
      success: true,
      data: topupRequest,
    });
  } catch (error) {
    console.error("Error fetching topup request:", error);
    console.error("Error details:", {
      requestId: params.id,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
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
        { success: false, error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const { id } = params;
    const body = await request.json();
    const { status, adminNotes, transactionId } = body;

    console.log(`Admin ${session.user.id} updating topup request ${id}:`, {
      newStatus: status,
      hasAdminNotes: !!adminNotes,
      hasTransactionId: !!transactionId,
    });

    // Validate status
    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 },
      );
    }

    // Get existing request
    const existingRequest = await prisma.topupRequest.findUnique({
      where: { id },
      include: {
        user: true,
        selectedWallet: true,
      },
    });

    if (!existingRequest) {
      console.error(`Topup request not found for update: ${id}`);
      return NextResponse.json(
        { success: false, error: "Topup request not found" },
        { status: 404 },
      );
    }

    console.log("Existing request details:", {
      requestId: existingRequest.id,
      currentStatus: existingRequest.status,
      userId: existingRequest.userId,
      userName: existingRequest.user.name,
      amount: existingRequest.amount,
    });

    // Check if already processed
    if (existingRequest.status !== "PENDING") {
      console.warn(`Attempt to update already processed request: ${id}`, {
        currentStatus: existingRequest.status,
        attemptedStatus: status,
        adminId: session.user.id,
      });
      return NextResponse.json(
        { success: false, error: "Request has already been processed" },
        { status: 400 },
      );
    }

    // Use transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update topup request
      const updatedRequest = await tx.topupRequest.update({
        where: { id },
        data: {
          status,
          adminNotes: adminNotes || null,
          transactionId: transactionId || null,
          processedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              walletBalance: true,
            },
          },
          selectedWallet: true,
        },
      });

      // If approved, update user's wallet balance
      if (status === "APPROVED") {
        const newBalance =
          existingRequest.user.walletBalance + existingRequest.amount;

        // Check if this is a USDT payment (eligible for 3% commission bonus)
        const isUsdtPayment =
          existingRequest.selectedWallet?.walletType === ("USDT_TRC20" as any);
        let commissionBonus = 0;
        let newCommissionBalance = existingRequest.user.commissionBalance;

        if (isUsdtPayment) {
          commissionBonus = existingRequest.amount * 0.03; // 3% bonus
          newCommissionBalance =
            existingRequest.user.commissionBalance + commissionBonus;
        }

        await tx.user.update({
          where: { id: existingRequest.userId },
          data: {
            walletBalance: newBalance,
            ...(isUsdtPayment && { commissionBalance: newCommissionBalance }),
          },
        });

        // Create wallet transaction record for main topup
        await tx.walletTransaction.create({
          data: {
            userId: existingRequest.userId,
            type: "CREDIT",
            amount: existingRequest.amount,
            balanceAfter: newBalance,
            description: `Topup approved - ${existingRequest.selectedWallet?.walletType} wallet`,
            referenceId: `TOPUP_${existingRequest.id}`,
            status: "COMPLETED",
            metadata: JSON.stringify({
              topupRequestId: existingRequest.id,
              walletType: existingRequest.selectedWallet?.walletType,
              transactionId: transactionId,
              isUsdtPayment,
            }),
          },
        });

        // Create commission bonus transaction if USDT payment
        if (isUsdtPayment && commissionBonus > 0) {
          await tx.walletTransaction.create({
            data: {
              userId: existingRequest.userId,
              type: "CREDIT" as any,
              amount: commissionBonus,
              balanceAfter: newCommissionBalance,
              description: `USDT Topup Bonus (3%) - ${existingRequest.selectedWallet?.walletType}`,
              referenceId: `USDT_BONUS_${existingRequest.id}`,
              status: "COMPLETED",
              metadata: JSON.stringify({
                topupRequestId: existingRequest.id,
                bonusPercentage: 3,
                originalAmount: existingRequest.amount,
                bonusAmount: commissionBonus,
                transactionType: "COMMISSION",
              }),
            },
          });
        }
      }

      return updatedRequest;
    });

    console.log("Topup request updated successfully:", {
      requestId: result.id,
      newStatus: result.status,
      userId: result.userId,
      userName: result.user.name,
      amount: existingRequest.amount,
      balanceUpdated: status === "APPROVED",
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: status === "APPROVED" ? "BULK_UPDATE" : "BULK_UPDATE",
        targetType: "topup_request",
        targetId: id,
        description: `${status.toLowerCase()} topup request for ${existingRequest.amount} PKR`,
        details: JSON.stringify({
          userId: existingRequest.userId,
          amount: existingRequest.amount,
          status: { from: existingRequest.status, to: status },
          adminNotes,
          transactionId,
          isUsdtPayment:
            existingRequest.selectedWallet?.walletType ===
            ("USDT_TRC20" as any),
          commissionBonus:
            existingRequest.selectedWallet?.walletType === ("USDT_TRC20" as any)
              ? existingRequest.amount * 0.03
              : 0,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Topup request ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Error updating topup request:", error);
    console.error("Update error details:", {
      requestId: params.id,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getAdminSession();

    if (!session?.user?.role || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Super admin access required" },
        { status: 401 },
      );
    }

    const { id } = params;

    // Get existing request
    const existingRequest = await prisma.topupRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: "Topup request not found" },
        { status: 404 },
      );
    }

    // Only allow deletion of pending or rejected requests
    if (existingRequest.status === "APPROVED") {
      return NextResponse.json(
        { success: false, error: "Cannot delete approved requests" },
        { status: 400 },
      );
    }

    // Delete the request
    await prisma.topupRequest.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "BULK_UPDATE",
        targetType: "topup_request",
        targetId: id,
        description: `Deleted topup request for ${existingRequest.amount} PKR`,
        details: JSON.stringify({
          userId: existingRequest.userId,
          amount: existingRequest.amount,
          status: existingRequest.status,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Topup request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting topup request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
