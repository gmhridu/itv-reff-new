import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get available admin wallets
    const wallets = await prisma.adminWallet.findMany({
      where: { isActive: true },
      select: {
        id: true,
        walletType: true,
        walletNumber: true,
        walletHolderName: true,
      },
      orderBy: { walletType: "asc" },
    });

    // Get user's topup requests
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [userRequests, total] = await Promise.all([
      prisma.topupRequest.findMany({
        where: { userId: session.user.id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          selectedWallet: {
            select: {
              walletType: true,
              walletNumber: true,
              walletHolderName: true,
            },
          },
        },
      }),
      prisma.topupRequest.count({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        wallets,
        requests: userRequests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching topup data:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { amount, selectedWalletId, paymentProof } = body;

    // Validate required fields
    if (!amount || !selectedWalletId) {
      return NextResponse.json(
        { success: false, error: "Amount and wallet selection are required" },
        { status: 400 },
      );
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 },
      );
    }

    // Check minimum topup amount (example: 100 PKR)
    if (amount < 100) {
      return NextResponse.json(
        { success: false, error: "Minimum topup amount is 100 PKR" },
        { status: 400 },
      );
    }

    // Check if selected wallet exists and is active
    const selectedWallet = await prisma.adminWallet.findUnique({
      where: { id: selectedWalletId },
    });

    if (!selectedWallet || !selectedWallet.isActive) {
      return NextResponse.json(
        { success: false, error: "Selected wallet is not available" },
        { status: 400 },
      );
    }

    // Check for pending requests
    const pendingRequest = await prisma.topupRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING",
      },
    });

    if (pendingRequest) {
      return NextResponse.json(
        { success: false, error: "You already have a pending topup request" },
        { status: 400 },
      );
    }

    // Create topup request
    const topupRequest = await prisma.topupRequest.create({
      data: {
        userId: session.user.id,
        amount,
        selectedWalletId,
        paymentProof: paymentProof || null,
        status: "PENDING",
      },
      include: {
        selectedWallet: {
          select: {
            walletType: true,
            walletNumber: true,
            walletHolderName: true,
          },
        },
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        activity: "topup_request",
        description: `Created topup request for ${amount} PKR`,
        metadata: JSON.stringify({
          requestId: topupRequest.id,
          amount,
          walletType: selectedWallet.walletType,
          walletNumber: selectedWallet.walletNumber,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: topupRequest,
      message: "Topup request created successfully",
    });
  } catch (error) {
    console.error("Error creating topup request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
