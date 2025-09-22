import { NextRequest, NextResponse } from "next/server";
import { withdrawalConfigService } from "@/lib/admin/withdrawal-config-service";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { adminAuthMiddleware } from "@/lib/api/api-auth";

// GET - Get withdrawal configuration
export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate admin user
    const isAuthenticated = await adminAuthMiddleware(request);
    if (!isAuthenticated) {
      response = NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    const config = await withdrawalConfigService.getWithdrawalConfig();
    const stats = await withdrawalConfigService.getWithdrawalStats();

    response = NextResponse.json({
      success: true,
      data: {
        config,
        stats,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error fetching withdrawal configuration:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// PUT - Update withdrawal configuration
export async function PUT(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate admin user
    const isAuthenticated = await adminAuthMiddleware(request);
    if (!isAuthenticated) {
      response = NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    const body = await request.json();
    const {
      minimumWithdrawal,
      maxDailyWithdrawals,
      withdrawalFeePercentage,
      usdtWithdrawalEnabled,
      bankWithdrawalEnabled,
      withdrawalProcessingTime,
      usdtProcessingTime,
      usdtToPkrRate,
    } = body;

    // Validate input
    if (
      minimumWithdrawal !== undefined &&
      (minimumWithdrawal < 0 || minimumWithdrawal > 1000000)
    ) {
      response = NextResponse.json(
        { error: "Invalid minimum withdrawal amount" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    if (
      maxDailyWithdrawals !== undefined &&
      (maxDailyWithdrawals < 1 || maxDailyWithdrawals > 50)
    ) {
      response = NextResponse.json(
        { error: "Invalid daily withdrawal limit" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    if (
      withdrawalFeePercentage !== undefined &&
      (withdrawalFeePercentage < 0 || withdrawalFeePercentage > 100)
    ) {
      response = NextResponse.json(
        { error: "Invalid withdrawal fee percentage" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    if (
      usdtToPkrRate !== undefined &&
      (usdtToPkrRate < 100 || usdtToPkrRate > 1000)
    ) {
      response = NextResponse.json(
        { error: "Invalid USDT to PKR rate" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Update configuration
    const updatedConfig = await withdrawalConfigService.updateWithdrawalConfig({
      minimumWithdrawal,
      maxDailyWithdrawals,
      withdrawalFeePercentage,
      usdtWithdrawalEnabled,
      bankWithdrawalEnabled,
      withdrawalProcessingTime,
      usdtProcessingTime,
      usdtToPkrRate,
    });

    response = NextResponse.json({
      success: true,
      message: "Withdrawal configuration updated successfully",
      data: updatedConfig,
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error updating withdrawal configuration:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// POST - Perform withdrawal configuration actions
export async function POST(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate admin user
    const isAuthenticated = await adminAuthMiddleware(request);
    if (!isAuthenticated) {
      response = NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "validate-user-withdrawal") {
      const body = await request.json();
      const { userId, amount, walletType, paymentMethodId } = body;

      if (!userId || !amount || !walletType || !paymentMethodId) {
        response = NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 },
        );
        return addAPISecurityHeaders(response);
      }

      const validation = await withdrawalConfigService.validateWithdrawal(
        userId,
        parseFloat(amount),
        walletType,
        paymentMethodId,
      );

      response = NextResponse.json({
        success: true,
        data: validation,
      });

      return addAPISecurityHeaders(response);
    }

    if (action === "calculate-withdrawal") {
      const body = await request.json();
      const { amount, isUsdtWithdrawal } = body;

      if (!amount) {
        response = NextResponse.json(
          { error: "Amount is required" },
          { status: 400 },
        );
        return addAPISecurityHeaders(response);
      }

      const calculation = await withdrawalConfigService.calculateWithdrawal(
        parseFloat(amount),
        isUsdtWithdrawal || false,
      );

      response = NextResponse.json({
        success: true,
        data: calculation,
      });

      return addAPISecurityHeaders(response);
    }

    if (action === "check-user-daily-limit") {
      const body = await request.json();
      const { userId } = body;

      if (!userId) {
        response = NextResponse.json(
          { error: "User ID is required" },
          { status: 400 },
        );
        return addAPISecurityHeaders(response);
      }

      const dailyCount =
        await withdrawalConfigService.getUserDailyWithdrawalCount(userId);
      const canWithdraw =
        await withdrawalConfigService.canUserWithdrawToday(userId);
      const config = await withdrawalConfigService.getWithdrawalConfig();

      response = NextResponse.json({
        success: true,
        data: {
          dailyCount,
          maxDailyWithdrawals: config.maxDailyWithdrawals,
          canWithdrawToday: canWithdraw,
          remainingWithdrawals: Math.max(
            0,
            config.maxDailyWithdrawals - dailyCount,
          ),
        },
      });

      return addAPISecurityHeaders(response);
    }

    response = NextResponse.json({ error: "Invalid action" }, { status: 400 });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error in withdrawal configuration action:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
