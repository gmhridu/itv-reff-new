import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
      prisma.adminWallet.findMany({
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
      prisma.adminWallet.count({ where }),
    ]);

    // Get statistics
    const statistics = await prisma.adminWallet.aggregate({
      _count: {
        id: true,
      },
      where: { isActive: true },
    });

    const inactiveCount = await prisma.adminWallet.count({
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
    const { walletType, walletNumber, walletHolderName } = body;

    // Validate required fields
    if (!walletType || !walletNumber || !walletHolderName) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate wallet type
    if (!["JAZZCASH", "EASYPAISA"].includes(walletType)) {
      return NextResponse.json(
        { success: false, error: "Invalid wallet type" },
        { status: 400 },
      );
    }

    // Check if wallet number already exists
    const existingWallet = await prisma.adminWallet.findFirst({
      where: {
        walletNumber,
        walletType,
      },
    });

    if (existingWallet) {
      return NextResponse.json(
        { success: false, error: "Wallet with this number already exists" },
        { status: 400 },
      );
    }

    // Create new wallet
    const newWallet = await prisma.adminWallet.create({
      data: {
        walletType,
        walletNumber,
        walletHolderName,
      },
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
