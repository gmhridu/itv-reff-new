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
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get fresh user data
    const freshUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        walletBalance: true, // Current Balance (topup balance only)
        commissionBalance: true, // Commission wallet (legacy field)
        depositPaid: true, // Security Deposited
      },
    });

    if (!freshUser) {
      response = NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    // Calculate individual commission balances using hierarchical system (same as withdrawal logic)
    const commissionTypes = [
      { type: "TASK_INCOME", name: "Daily Task Commission" },
      { type: "REFERRAL_REWARD_A", name: "Referral Invite Commission" },
      { type: "REFERRAL_REWARD_B", name: "Referral Task Commission B" },
      { type: "REFERRAL_REWARD_C", name: "Referral Task Commission C" },
      { type: "TOPUP_BONUS", name: "USDT Top-up Bonus (3%)" },
      { type: "SPECIAL_COMMISSION", name: "Special Commission" },
    ];

    // Calculate balance for each commission type (includes both earnings and deductions)
    let actualTotalEarnings = 0;
    const commissionBreakdown: { [key: string]: number } = {};

    console.log(`[DEBUG] Calculating balances for user: ${user.id}`);

    for (const commission of commissionTypes) {
      const balance = await db.walletTransaction.aggregate({
        where: {
          userId: user.id,
          type: commission.type as any,
          status: "COMPLETED",
        },
        _sum: { amount: true },
      });

      const rawBalance = balance._sum.amount || 0;
      const currentBalance = Math.max(0, rawBalance); // Ensure no negative balances
      commissionBreakdown[commission.type] = currentBalance;
      actualTotalEarnings += currentBalance;

      console.log(`[DEBUG] ${commission.name}: raw=${rawBalance}, displayed=${currentBalance}`);
    }

    console.log(`[DEBUG] Total Commission Earnings: ${actualTotalEarnings}`);

    // Get security refunds with withdrawal deductions properly accounted for
    let totalSecurityRefund = 0;
    try {
      // Strategy: Always prioritize transaction-based calculation over request-based
      // This ensures withdrawal deductions are properly reflected

      // First, get all security refund transactions (credits and deductions)
      const securityRefundTransactions = await db.walletTransaction.aggregate({
        where: {
          userId: user.id,
          type: "SECURITY_REFUND" as any,
          status: "COMPLETED",
        },
        _sum: { amount: true },
      });

      const transactionAmount = securityRefundTransactions._sum.amount || 0;
      console.log(`[DEBUG] Security Refund Transactions Sum: ${transactionAmount}`);

      if (transactionAmount > 0) {
        // If we have positive transaction balance, use it (accounts for deductions)
        totalSecurityRefund = transactionAmount;
        console.log(`[DEBUG] Using transaction-based security refund: ${totalSecurityRefund}`);
      } else {
        // Fallback: Check approved requests if no transactions exist
        const securityRefunds = await db.securityRefundRequest.aggregate({
          where: {
            userId: user.id,
            status: "APPROVED",
          },
          _sum: {
            refundAmount: true,
          },
        });

        const requestAmount = securityRefunds._sum.refundAmount || 0;
        console.log(`[DEBUG] Security Refund Requests Sum: ${requestAmount}`);

        // If there are approved requests but no transactions, we need to create initial transactions
        if (requestAmount > 0 && transactionAmount === 0) {
          console.log(`[DEBUG] Found approved security refund requests without transactions - this needs manual intervention`);
          // For now, use the request amount but log this issue
          totalSecurityRefund = requestAmount;
        } else {
          totalSecurityRefund = Math.max(0, transactionAmount);
        }
      }

      console.log(`[DEBUG] Final Security Refund: ${totalSecurityRefund}`);
    } catch (error: any) {
      console.warn("Security refund calculation error:", error.message);
      totalSecurityRefund = 0;
    }

    // According to requirements:
    // - Current Balance (mainWallet) = Only topup balance (NOT part of Total Available for Withdrawal)
    // - Commission Wallet = Total Earnings (the 5 earning types)
    // - Security Deposited = Level deposit amounts (NOT part of Total Available for Withdrawal)
    // - Total Available for Withdrawal = Total Earnings (5 types) + Security Refund

    const totalAvailableForWithdrawal = actualTotalEarnings + totalSecurityRefund; // Total Earnings + Security Refund

    console.log(`[DEBUG] Final Calculation:`);
    console.log(`[DEBUG] - Total Earnings: ${actualTotalEarnings}`);
    console.log(`[DEBUG] - Security Refund: ${totalSecurityRefund}`);
    console.log(`[DEBUG] - Total Available for Withdrawal: ${totalAvailableForWithdrawal}`);

    response = NextResponse.json({
      success: true,
      walletBalances: {
        // These are the current fields that the withdrawal component expects
        mainWallet: freshUser.walletBalance || 0, // Current Balance (topup balance only) - NOT part of withdrawal
        commissionWallet: actualTotalEarnings, // Total Earnings from the 5 commission types
        totalEarnings: actualTotalEarnings, // Same as commissionWallet for consistency

        // Additional fields for clarity and future use
        securityDeposited: freshUser.depositPaid || 0, // Security deposits (NOT part of withdrawal)
        securityRefund: totalSecurityRefund, // Security refunds (NOT part of withdrawal)
        totalAvailableForWithdrawal: totalAvailableForWithdrawal, // Total Earnings + Security Refund
      },

      // Additional metadata
      metadata: {
        calculation: {
          totalEarnings: actualTotalEarnings,
          securityRefund: totalSecurityRefund,
          totalAvailableForWithdrawal: totalAvailableForWithdrawal,
          commissionBreakdown: commissionBreakdown,
        },
        note: "Total Available for Withdrawal = Total Earnings (5 types) + Security Refund. Current Balance and Security Deposited are NOT included.",
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error: any) {
    console.error("Get wallet balances error:", error);

    response = NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}