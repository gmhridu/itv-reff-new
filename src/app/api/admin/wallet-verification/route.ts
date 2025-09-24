import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { WalletVerificationService } from "@/lib/utils/wallet-verification";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { db } from "@/lib/db";

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

    // Check if user is admin (you may need to adjust this based on your admin system)
    // For now, assuming there's an admin role or specific admin users
    const adminUser = await db.user.findUnique({
      where: { id: user.id },
      select: { email: true, phone: true },
    });

    // Add your admin check logic here
    // if (!isAdmin(adminUser)) {
    //   return addAPISecurityHeaders(NextResponse.json(
    //     { success: false, error: "Admin access required" },
    //     { status: 403 }
    //   ));
    // }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    switch (action) {
      case "verify-user":
        if (!userId) {
          response = NextResponse.json(
            {
              success: false,
              error: "userId parameter required for verify-user action",
            },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        const userReport =
          await WalletVerificationService.verifyUserWallet(userId);
        response = NextResponse.json({
          success: true,
          data: userReport,
        });
        break;

      case "verify-all":
        const allReports =
          await WalletVerificationService.verifyAllWallets(limit);
        const discrepancyReports = allReports.filter(
          (r) => r.discrepancies.hasDiscrepancies,
        );

        response = NextResponse.json({
          success: true,
          data: {
            total: allReports.length,
            withDiscrepancies: discrepancyReports.length,
            reports: allReports,
            discrepancyReports,
          },
        });
        break;

      case "system-summary":
        const summary = await WalletVerificationService.generateSystemSummary();
        response = NextResponse.json({
          success: true,
          data: summary,
        });
        break;

      case "check-referral":
        if (!userId) {
          response = NextResponse.json(
            {
              success: false,
              error: "userId parameter required for check-referral action",
            },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        const referralSetup =
          await WalletVerificationService.checkReferralSetup(userId);
        response = NextResponse.json({
          success: true,
          data: referralSetup,
        });
        break;

      default:
        response = NextResponse.json(
          {
            success: false,
            error:
              "Invalid action. Supported actions: verify-user, verify-all, system-summary, check-referral",
          },
          { status: 400 },
        );
        break;
    }

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Wallet verification API error:", error);
    response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

export async function POST(request: NextRequest) {
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

    // Add admin check here similar to GET method

    const body = await request.json();
    const { action, userId, userIds } = body;

    switch (action) {
      case "fix-user-wallet":
        if (!userId) {
          response = NextResponse.json(
            {
              success: false,
              error: "userId required for fix-user-wallet action",
            },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        const fixResult = await WalletVerificationService.fixUserWallet(userId);
        response = NextResponse.json({
          success: fixResult.success,
          message: fixResult.message,
        });
        break;

      case "fix-multiple-wallets":
        if (!userIds || !Array.isArray(userIds)) {
          response = NextResponse.json(
            {
              success: false,
              error: "userIds array required for fix-multiple-wallets action",
            },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        const results: Array<{
          userId: string;
          success: boolean;
          message: string;
        }> = [];
        for (const id of userIds) {
          try {
            const result = await WalletVerificationService.fixUserWallet(id);
            results.push({ userId: id, ...result });
          } catch (error) {
            results.push({
              userId: id,
              success: false,
              message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
          }
        }

        response = NextResponse.json({
          success: true,
          results,
          summary: {
            total: results.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
          },
        });
        break;

      default:
        response = NextResponse.json(
          {
            success: false,
            error:
              "Invalid action. Supported actions: fix-user-wallet, fix-multiple-wallets",
          },
          { status: 400 },
        );
        break;
    }

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Wallet verification POST API error:", error);
    response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
