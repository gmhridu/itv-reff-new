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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const walletType = searchParams.get("walletType");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    if (walletType && walletType !== "ALL") {
      where.walletType = walletType;
    }

    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
    }

    // Get wallets with pagination
    const [wallets, total] = await Promise.all([
      db.adminWallet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              topupRequests: true,
            },
          },
        },
      }),
      db.adminWallet.count({ where }),
    ]);

    // Get statistics
    const statistics = await db.adminWallet.aggregate({
      _count: {
        id: true,
      },
      where: { isActive: true },
    });

    const inactiveCount = await db.adminWallet.count({
      where: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        wallets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        statistics: {
          total: total,
          active: statistics._count.id,
          inactive: inactiveCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin wallets:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
    const {
      walletType,
      walletNumber,
      walletHolderName,
      usdtWalletAddress,
      qrCodeUrl,
    } = body;

    // Validate required fields
    if (!walletType || !walletHolderName) {
      return NextResponse.json(
        { success: false, error: "Wallet type and holder name are required" },
        { status: 400 },
      );
    }

    // Validate wallet type
    if (!["JAZZCASH", "EASYPAISA", "USDT_TRC20"].includes(walletType)) {
      return NextResponse.json(
        { success: false, error: "Invalid wallet type" },
        { status: 400 },
      );
    }

    // Validate wallet type specific requirements
    if (walletType === "USDT_TRC20") {
      if (!usdtWalletAddress) {
        return NextResponse.json(
          {
            success: false,
            error: "USDT wallet address is required for USDT wallets",
          },
          { status: 400 },
        );
      }
    } else {
      if (!walletNumber) {
        return NextResponse.json(
          {
            success: false,
            error: "Wallet number is required for JazzCash/EasyPaisa wallets",
          },
          { status: 400 },
        );
      }
    }

    // Check for duplicate wallet
    let duplicateCondition = {};
    if (walletType === "USDT_TRC20") {
      duplicateCondition = {
        usdtWalletAddress,
        walletType,
      };
    } else {
      duplicateCondition = {
        walletNumber,
        walletType,
      };
    }

    const existingWallet = await db.adminWallet.findFirst({
      where: duplicateCondition,
    });

    if (existingWallet) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet with this address/number already exists",
        },
        { status: 400 },
      );
    }

    // Create new wallet
    const walletData: any = {
      walletType,
      walletHolderName,
      qrCodeUrl: qrCodeUrl || null,
    };

    if (walletType === "USDT_TRC20") {
      walletData.usdtWalletAddress = usdtWalletAddress;
      walletData.walletNumber = null;
    } else {
      walletData.walletNumber = walletNumber;
      walletData.usdtWalletAddress = null;
    }

    const newWallet = await db.adminWallet.create({
      data: walletData,
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
      await db.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "BULK_UPDATE", // We can add a more specific action later
          targetType: "admin_wallet",
          targetId: newWallet.id,
          description: `Created new ${walletType} wallet`,
          details: JSON.stringify({
            walletNumber,
            walletHolderName,
            walletType,
          }),
        },
      });
    } catch (auditError) {
      console.error(
        "Failed to create audit log for wallet creation:",
        auditError,
      );
      // Continue execution - audit log failure shouldn't break wallet creation
    }

    return NextResponse.json({
      success: true,
      data: newWallet,
      message: "Wallet created successfully",
    });
  } catch (error) {
    console.error("Error creating admin wallet:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
