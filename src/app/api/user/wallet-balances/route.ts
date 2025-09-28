import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate the user
    const user = await authMiddleware(request);
    if (!user) {
      response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    // Get fresh user data
    const freshUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        walletBalance: true, // Current Balance (topup balance only)
        commissionBalance: true, // Commission wallet (legacy field)
        depositPaid: true, // Security Deposited
        securityRefund: true,
      },
    });

    if (!freshUser) {
      response = NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
      return addAPISecurityHeaders(response);
    }

    // if user has pending withdrawal request
    const withdrawalRequest = await db.withdrawalRequest.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });

    response = NextResponse.json({
      success: true,
      walletBalances: {
        canWithdraw: !withdrawalRequest,
        mainWallet: freshUser.walletBalance || 0,
        commissionWallet: freshUser.commissionBalance,
        totalEarnings: freshUser.commissionBalance,
        securityDeposited: freshUser.depositPaid || 0,
        securityRefund: freshUser.securityRefund,
        totalAvailableForWithdrawal:
          freshUser.commissionBalance + freshUser.securityRefund,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error: any) {
    console.error("Get wallet balances error:", error);

    // Handle specific database connection errors

    response = NextResponse.json(
      {
        error:
          "Please try again later.",
        code: "DB_CONNECTION_ERROR",
      },
      { status: 503 }
    );
    return addAPISecurityHeaders(response);
  }
}
