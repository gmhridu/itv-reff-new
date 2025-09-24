import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/lib/api/api-auth";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    const user = await authMiddleware(request);

    if (!user) {
      response = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get available admin wallets
    const wallets = await prisma.adminWallet.findMany({
      where: { isActive: true },
      select: {
        id: true,
        walletType: true,
        walletNumber: true,
        walletHolderName: true,
        usdtWalletAddress: true,
        qrCodeUrl: true,
      },
      orderBy: { walletType: "asc" },
    });

    console.log("Fetched wallets for user topup:", {
      totalWallets: wallets.length,
      walletTypes: wallets.map((w) => w.walletType),
      usdtWallets: wallets.filter((w) => w.walletType === "USDT_TRC20"),
      walletsWithUsdtAddress: wallets.filter((w) => w.usdtWalletAddress),
    });

    // Get USDT to PKR rate
    const usdtRateSetting = await prisma.setting.findUnique({
      where: { key: "usdt_to_pkr_rate" },
    });

    // Get user's topup requests
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [userRequests, total] = await Promise.all([
      prisma.topupRequest.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          selectedWallet: {
            select: {
              walletType: true,
              walletNumber: true,
              walletHolderName: true,
              usdtWalletAddress: true,
              qrCodeUrl: true,
            },
          },
        },
      }),
      prisma.topupRequest.count({
        where: { userId: user.id },
      }),
    ]);

    response = NextResponse.json({
      success: true,
      data: {
        wallets,
        requests: userRequests,
        usdtToPkrRate: usdtRateSetting
          ? parseFloat(usdtRateSetting.value)
          : 295,
        bonusPercentage: 3, // 3% bonus for USDT
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error fetching topup data:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let response: NextResponse;

  try {
    const user = await authMiddleware(request);

    if (!user) {
      console.error("Topup request failed: No valid session");
      response = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    console.log(`Topup request from user: ${user.id}`, {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    });

    const body = await request.json();
    const { amount, selectedWalletId, paymentProof, transactionId } = body;

    console.log("Topup request data:", {
      originalAmount: amount,
      amountType: typeof amount,
      selectedWalletId,
      hasPaymentProof: !!paymentProof,
      paymentProofUrl: paymentProof
        ? paymentProof.substring(0, 50) + "..."
        : null,
      transactionId,
    });

    // Validate required fields
    if (!amount || !selectedWalletId) {
      return NextResponse.json(
        { success: false, error: "Amount and wallet selection are required" },
        { status: 400 },
      );
    }

    // Validate amount - ensure it's a positive integer
    let parsedAmount: number;
    if (typeof amount === "string") {
      parsedAmount = parseInt(amount, 10);
    } else if (typeof amount === "number") {
      parsedAmount = Math.round(amount); // Ensure integer, no decimals
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid amount format" },
        { status: 400 },
      );
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 },
      );
    }

    // Check minimum topup amount (example: 100 PKR)
    if (parsedAmount < 100) {
      return NextResponse.json(
        { success: false, error: "Minimum topup amount is 100 PKR" },
        { status: 400 },
      );
    }

    // Check maximum topup amount
    if (parsedAmount > 1000000) {
      return NextResponse.json(
        { success: false, error: "Maximum topup amount is 1,000,000 PKR" },
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

    // Validate wallet-specific requirements
    if (selectedWallet.walletType === ("USDT_TRC20" as any)) {
      if (!(selectedWallet as any).usdtWalletAddress) {
        return NextResponse.json(
          { success: false, error: "USDT wallet address not configured" },
          { status: 400 },
        );
      }
    } else {
      if (!(selectedWallet as any).walletNumber) {
        return NextResponse.json(
          { success: false, error: "Wallet number not configured" },
          { status: 400 },
        );
      }
    }

    // Check for pending requests
    const pendingRequest = await prisma.topupRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    });

    if (pendingRequest) {
      return NextResponse.json(
        { success: false, error: "You already have a pending topup request" },
        { status: 400 },
      );
    }

    // Create topup request with parsed integer amount
    const topupRequest = await prisma.topupRequest.create({
      data: {
        userId: user.id,
        amount: parsedAmount,
        selectedWalletId,
        paymentProof: paymentProof || null,
        transactionId: transactionId || null,
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

    console.log("Topup request created successfully:", {
      requestId: topupRequest.id,
      userId: topupRequest.userId,
      userName: topupRequest.user?.name,
      userPhone: topupRequest.user?.phone,
      originalAmount: amount,
      parsedAmount: parsedAmount,
      storedAmount: topupRequest.amount,
      paymentProofStored: !!topupRequest.paymentProof,
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: "topup_request",
        description: `Created topup request for ${parsedAmount} PKR`,
        metadata: JSON.stringify({
          requestId: topupRequest.id,
          amount: parsedAmount,
          walletType: selectedWallet.walletType,
          walletNumber: (selectedWallet as any).walletNumber,
          usdtWalletAddress: (selectedWallet as any).usdtWalletAddress,
          hasPaymentProof: !!paymentProof,
          transactionId: transactionId || null,
          isUsdtPayment: selectedWallet.walletType === ("USDT_TRC20" as any),
          bonusEligible: selectedWallet.walletType === ("USDT_TRC20" as any),
          userInfo: {
            id: user.id,
            name: user.name,
            phone: user.phone,
          },
        }),
      },
    });

    response = NextResponse.json({
      success: true,
      data: topupRequest,
      message: "Topup request created successfully",
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error creating topup request:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    });
    response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
