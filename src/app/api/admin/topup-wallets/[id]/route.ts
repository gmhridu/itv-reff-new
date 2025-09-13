import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

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
        { success: false, error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const { id } = params;

    const wallet = await prisma.adminWallet.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            topupRequests: true,
          },
        },
        topupRequests: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
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
    const {
      walletNumber,
      walletHolderName,
      isActive,
      usdtWalletAddress,
      qrCodeUrl,
    } = body;

    // Check if wallet exists
    const existingWallet = await prisma.adminWallet.findUnique({
      where: { id },
    });

    if (!existingWallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 },
      );
    }

    // Check for duplicate wallet number/address if it's being changed
    if (existingWallet.walletType === ("USDT_TRC20" as any)) {
      if (
        usdtWalletAddress &&
        usdtWalletAddress !== (existingWallet as any).usdtWalletAddress
      ) {
        const duplicateWallet = await prisma.adminWallet.findFirst({
          where: {
            walletType: existingWallet.walletType,
            id: { not: id },
          },
        });

        if (duplicateWallet) {
          return NextResponse.json(
            {
              success: false,
              error: "Wallet with this USDT address already exists",
            },
            { status: 400 },
          );
        }
      }
    } else {
      if (
        walletNumber &&
        walletNumber !== (existingWallet as any).walletNumber
      ) {
        const duplicateWallet = await prisma.adminWallet.findFirst({
          where: {
            walletNumber,
            walletType: existingWallet.walletType,
            id: { not: id },
          },
        });

        if (duplicateWallet) {
          return NextResponse.json(
            { success: false, error: "Wallet with this number already exists" },
            { status: 400 },
          );
        }
      }
    }

    // Update wallet
    const updateData: any = {};
    if (walletNumber) updateData.walletNumber = walletNumber;
    if (walletHolderName) updateData.walletHolderName = walletHolderName;
    if (usdtWalletAddress) updateData.usdtWalletAddress = usdtWalletAddress;
    if (qrCodeUrl !== undefined) updateData.qrCodeUrl = qrCodeUrl || null;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const updatedWallet = await prisma.adminWallet.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            topupRequests: true,
          },
        },
      },
    });

    // Create audit log (non-blocking)
    try {
      await prisma.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "BULK_UPDATE",
          targetType: "admin_wallet",
          targetId: id,
          description: `Updated ${existingWallet.walletType} wallet`,
          details: JSON.stringify({
            changes: {
              ...(walletNumber && {
                walletNumber: {
                  from: (existingWallet as any).walletNumber,
                  to: walletNumber,
                },
              }),
              ...(walletHolderName && {
                walletHolderName: {
                  from: existingWallet.walletHolderName,
                  to: walletHolderName,
                },
              }),
              ...(usdtWalletAddress && {
                usdtWalletAddress: {
                  from: (existingWallet as any).usdtWalletAddress,
                  to: usdtWalletAddress,
                },
              }),
              ...(qrCodeUrl !== undefined && {
                qrCodeUrl: {
                  from: (existingWallet as any).qrCodeUrl,
                  to: qrCodeUrl || null,
                },
              }),
              ...(typeof isActive === "boolean" && {
                isActive: { from: existingWallet.isActive, to: isActive },
              }),
            },
          }),
        },
      });
    } catch (auditError) {
      console.error(
        "Failed to create audit log for wallet update:",
        auditError,
      );
      // Continue execution - audit log failure shouldn't break wallet update
    }

    return NextResponse.json({
      success: true,
      data: updatedWallet,
      message: "Wallet updated successfully",
    });
  } catch (error) {
    console.error("Error updating wallet:", error);
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

    // Check if wallet exists
    const existingWallet = await prisma.adminWallet.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            topupRequests: true,
          },
        },
      },
    });

    if (!existingWallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 },
      );
    }

    // Check if wallet has associated topup requests
    if (existingWallet._count.topupRequests > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete wallet with existing topup requests. Please deactivate instead.",
        },
        { status: 400 },
      );
    }

    // Delete wallet
    await prisma.adminWallet.delete({
      where: { id },
    });

    // Create audit log (non-blocking)
    try {
      await prisma.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "BULK_UPDATE",
          targetType: "admin_wallet",
          targetId: id,
          description: `Deleted ${existingWallet.walletType} wallet`,
          details: JSON.stringify({
            walletNumber: (existingWallet as any).walletNumber,
            walletHolderName: existingWallet.walletHolderName,
            walletType: existingWallet.walletType,
            usdtWalletAddress: (existingWallet as any).usdtWalletAddress,
          }),
        },
      });
    } catch (auditError) {
      console.error(
        "Failed to create audit log for wallet deletion:",
        auditError,
      );
      // Continue execution - audit log failure shouldn't break wallet deletion
    }

    return NextResponse.json({
      success: true,
      message: "Wallet deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
