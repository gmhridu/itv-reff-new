import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

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
      return NextResponse.json(
        { success: false, error: "Topup request not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: topupRequest,
    });
  } catch (error) {
    console.error("Error fetching topup request:", error);
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
    const session = await getServerSession(authOptions);

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
      return NextResponse.json(
        { success: false, error: "Topup request not found" },
        { status: 404 },
      );
    }

    // Check if already processed
    if (existingRequest.status !== "PENDING") {
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

        await tx.user.update({
          where: { id: existingRequest.userId },
          data: {
            walletBalance: newBalance,
          },
        });

        // Create wallet transaction record
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
            }),
          },
        });
      }

      return updatedRequest;
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
    const session = await getServerSession(authOptions);

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
