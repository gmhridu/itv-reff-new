import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { hashPassword } from "@/lib/api/auth";
import { db as prisma } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { fundPassword } = body;

    // Validate required fields
    if (!fundPassword) {
      response = NextResponse.json(
        { error: "Fund password is required" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Validate fund password format (6 digits)
    if (!/^\d{6}$/.test(fundPassword)) {
      response = NextResponse.json(
        { error: "Fund password must be exactly 6 digits" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Check if user already has a fund password using raw query
    const userData = await prisma.$queryRaw<{ fundPassword: string | null }[]>`
      SELECT "fundPassword" FROM "users" WHERE "id" = ${user.id}
    `;

    if (!userData || userData.length === 0) {
      response = NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    if (userData[0].fundPassword) {
      response = NextResponse.json(
        { error: "Fund password already exists. Use change endpoint instead." },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Hash the fund password
    const hashedFundPassword = await hashPassword(fundPassword);

    // Update the user's fund password in the database using raw query
    await prisma.$executeRaw`
      UPDATE "users"
      SET "fundPassword" = ${hashedFundPassword}, "updatedAt" = NOW()
      WHERE "id" = ${user.id}
    `;

    // Log the fund password setup activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: "fund_password_set",
        description: "User set their fund password",
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
        }),
      },
    });

    response = NextResponse.json({
      success: true,
      message: "Fund password set successfully",
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Set fund password error:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
