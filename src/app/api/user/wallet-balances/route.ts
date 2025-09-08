import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db as prisma } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate the user
    const user = await authMiddleware(request);
    if (!user) {
      response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get user's wallet balances from database using raw query
    const userData = await prisma.$queryRaw<
      {
        walletBalance: number;
        commissionBalance: number;
        totalEarnings: number;
      }[]
    >`
      SELECT "walletBalance", "commissionBalance", "totalEarnings"
      FROM "users"
      WHERE "id" = ${user.id}
    `;

    if (!userData || userData.length === 0) {
      response = NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    response = NextResponse.json({
      success: true,
      walletBalances: {
        mainWallet: userData[0].walletBalance || 0,
        commissionWallet: userData[0].commissionBalance || 0,
        totalEarnings: userData[0].totalEarnings || 0,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Get wallet balances error:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
