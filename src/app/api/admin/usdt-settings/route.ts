import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    // Get USDT to PKR rate
    const usdtRateSetting = await db.setting.findUnique({
      where: { key: "usdt_to_pkr_rate" },
    });

    // Get USDT wallet info
    const usdtWallet = await db.adminWallet.findFirst({
      where: { walletType: "USDT_TRC20" as any, isActive: true },
      include: {
        _count: {
          select: {
            topupRequests: true,
          },
        },
      },
    });

    // Parse USDT rate as integer to avoid floating point precision issues
    let usdtToPkrRate = 295; // Default rate
    if (usdtRateSetting) {
      const parsedRate = parseFloat(usdtRateSetting.value);
      usdtToPkrRate = Math.round(parsedRate); // Round to nearest integer
    }

    return NextResponse.json({
      success: true,
      data: {
        usdtToPkrRate,
        lastUpdated: usdtRateSetting?.updatedAt || null,
        usdtWallet,
        bonusPercentage: 3, // Fixed 3% bonus
      },
    });
  } catch (error) {
    console.error("Error fetching USDT settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { usdtToPkrRate, walletHolderName, usdtWalletAddress, qrCodeUrl } =
      body;

    // Validate and parse USDT rate
    let parsedUsdtRate: number | null = null;
    if (usdtToPkrRate) {
      if (typeof usdtToPkrRate === "string") {
        parsedUsdtRate = parseFloat(usdtToPkrRate);
      } else if (typeof usdtToPkrRate === "number") {
        parsedUsdtRate = usdtToPkrRate;
      }

      // Round to avoid floating point precision issues
      if (parsedUsdtRate) {
        parsedUsdtRate = Math.round(parsedUsdtRate);
      }

      if (!parsedUsdtRate || parsedUsdtRate <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid USDT to PKR rate" },
          { status: 400 },
        );
      }
    }

    // Update USDT rate if provided
    if (parsedUsdtRate) {
      await db.setting.upsert({
        where: { key: "usdt_to_pkr_rate" },
        update: {
          value: parsedUsdtRate.toString(),
          updatedAt: new Date(),
        },
        create: {
          key: "usdt_to_pkr_rate",
          value: parsedUsdtRate.toString(),
        },
      });
    }

    // Update or create USDT wallet if wallet info provided
    let usdtWallet: any = null;
    if (walletHolderName || usdtWalletAddress || qrCodeUrl !== undefined) {
      // Check if USDT wallet exists
      const existingUsdtWallet = await db.adminWallet.findFirst({
        where: { walletType: "USDT_TRC20" as any },
      });

      if (existingUsdtWallet) {
        // Update existing wallet
        const updateData: any = {};
        if (walletHolderName) updateData.walletHolderName = walletHolderName;
        if (usdtWalletAddress) updateData.usdtWalletAddress = usdtWalletAddress;
        if (qrCodeUrl !== undefined) updateData.qrCodeUrl = qrCodeUrl || null;

        usdtWallet = await db.adminWallet.update({
          where: { id: existingUsdtWallet.id },
          data: updateData,
          include: {
            _count: {
              select: {
                topupRequests: true,
              },
            },
          },
        });
      } else if (walletHolderName && usdtWalletAddress) {
        // Create new USDT wallet
        const createData: any = {
          walletType: "USDT_TRC20" as any,
          walletHolderName,
          usdtWalletAddress,
          qrCodeUrl: qrCodeUrl || null,
          walletNumber: null, // USDT doesn't use phone number
        };

        usdtWallet = await db.adminWallet.create({
          data: createData,
          include: {
            _count: {
              select: {
                topupRequests: true,
              },
            },
          },
        });
      }
    }

    // Create audit log
    try {
      await db.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "BULK_UPDATE",
          targetType: "usdt_settings",
          targetId: "usdt_settings",
          description: "Updated USDT settings",
          details: JSON.stringify({
            usdtToPkrRate,
            walletUpdated: !!usdtWallet,
            walletId: usdtWallet ? usdtWallet.id : null,
          }),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "USDT settings updated successfully",
      data: {
        usdtToPkrRate: parsedUsdtRate,
        usdtWallet,
      },
    });
  } catch (error) {
    console.error("Error updating USDT settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
