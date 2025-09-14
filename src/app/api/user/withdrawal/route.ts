import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { verifyPassword } from "@/lib/api/auth";
import { db as prisma } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import {
  notificationService,
  NotificationType,
  NotificationSeverity,
} from "@/lib/admin/notification-service";
import { NotificationService } from "@/lib/notification-service";

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

    // Check if user is an Intern - Intern users cannot withdraw
    if (
      user.isIntern ||
      (user.currentPosition && user.currentPosition.name === "Intern")
    ) {
      response = NextResponse.json(
        { error: "Intern position earnings cannot be withdrawn" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    const body = await request.json();
    const { walletType, amount, fundPassword, paymentMethodId, usdtToPkrRate } =
      body;

    // Validate required fields
    if (!walletType || !amount || !fundPassword || !paymentMethodId) {
      response = NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Validate amount
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount < 500) {
      response = NextResponse.json(
        { error: "Minimum withdrawal amount is PKR 500" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Validate predefined amounts
    const predefinedAmounts = [500, 3000, 10000, 30000, 100000, 250000, 500000];
    if (!predefinedAmounts.includes(withdrawalAmount)) {
      response = NextResponse.json(
        { error: "Please select from predefined withdrawal amounts only" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get user with fund password and wallet balances using raw query
    const userData = await prisma.$queryRaw<
      {
        fundPassword: string | null;
        walletBalance: number;
        commissionBalance: number;
      }[]
    >`
      SELECT "fundPassword", "walletBalance", "commissionBalance"
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

    // Check if user has fund password set
    if (!userData[0].fundPassword) {
      response = NextResponse.json(
        {
          error: "Fund password not set. Please set your fund password first.",
        },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Verify fund password
    const isFundPasswordValid = await verifyPassword(
      fundPassword,
      userData[0].fundPassword,
    );

    if (!isFundPasswordValid) {
      response = NextResponse.json(
        { error: "Invalid fund password" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Check wallet balance based on selected wallet type
    let availableBalance = 0;
    if (walletType === "Main Wallet") {
      availableBalance = userData[0].walletBalance || 0;
    } else if (walletType === "Commission Wallet") {
      availableBalance = userData[0].commissionBalance || 0;
    } else {
      response = NextResponse.json(
        { error: "Invalid wallet type" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Check if user has sufficient balance
    if (availableBalance < withdrawalAmount) {
      response = NextResponse.json(
        {
          error: `Insufficient balance in ${walletType}. Available: PKR ${availableBalance.toFixed(2)}`,
        },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Verify bank card exists and belongs to user
    const bankCard = await prisma.bankCard.findFirst({
      where: {
        id: paymentMethodId,
        userId: user.id,
        isActive: true,
      },
    });

    if (!bankCard) {
      response = NextResponse.json(
        { error: "Invalid payment method selected" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Calculate fees based on withdrawal type
    const isUsdtWithdrawal = bankCard.bankName === "USDT_TRC20";
    let handlingFee: number;
    let totalDeduction: number;

    if (isUsdtWithdrawal) {
      // For USDT: 5% network fee, but we don't deduct from PKR balance
      // PKR amount stays the same, USDT amount is reduced by fee
      handlingFee = 0; // No PKR deduction for fees
      totalDeduction = withdrawalAmount;
    } else {
      // For traditional: 10% handling fee
      handlingFee = withdrawalAmount * 0.1;
      totalDeduction = withdrawalAmount + handlingFee;
    }

    // Check if user has enough balance including handling fee
    if (availableBalance < totalDeduction) {
      response = NextResponse.json(
        {
          error: `Insufficient balance including 10% handling fee. Required: PKR ${totalDeduction.toFixed(2)}, Available: PKR ${availableBalance.toFixed(2)}`,
        },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Create withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount: withdrawalAmount,
        paymentMethod: bankCard.bankName,
        paymentDetails: JSON.stringify({
          bankName: bankCard.bankName,
          accountNumber: bankCard.accountNumber,
          cardHolderName: bankCard.cardHolderName,
          walletType: walletType,
          handlingFee: handlingFee,
          isUsdtWithdrawal: isUsdtWithdrawal,
          usdtRate: usdtToPkrRate || 295,
          usdtAmount: isUsdtWithdrawal
            ? withdrawalAmount / (usdtToPkrRate || 295)
            : null,
          usdtNetworkFee: isUsdtWithdrawal
            ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.05
            : null,
          usdtAmountAfterFee: isUsdtWithdrawal
            ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.95
            : null,
        }),
        status: "PENDING",
      },
    });

    // Deduct amount from the appropriate wallet using raw queries
    if (walletType === "Main Wallet") {
      await prisma.$executeRaw`
        UPDATE "users"
        SET "walletBalance" = "walletBalance" - ${totalDeduction}
        WHERE "id" = ${user.id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "users"
        SET "commissionBalance" = "commissionBalance" - ${totalDeduction}
        WHERE "id" = ${user.id}
      `;
    }

    // Create wallet transaction record
    await prisma.walletTransaction.create({
      data: {
        userId: user.id,
        type: "DEBIT",
        amount: -totalDeduction,
        balanceAfter:
          walletType === "Main Wallet"
            ? userData[0].walletBalance - totalDeduction
            : userData[0].commissionBalance - totalDeduction,
        description: isUsdtWithdrawal
          ? `USDT withdrawal request - ${bankCard.accountNumber.slice(0, 8)}...${bankCard.accountNumber.slice(-8)}`
          : `Withdrawal request - ${bankCard.bankName} ${bankCard.accountNumber} (including 10% handling fee)`,
        referenceId: withdrawalRequest.id,
        status: "COMPLETED",
        metadata: JSON.stringify({
          walletType: walletType,
          withdrawalAmount: withdrawalAmount,
          handlingFee: handlingFee,
          paymentMethod: bankCard.bankName,
          accountNumber: bankCard.accountNumber,
          isUsdtWithdrawal: isUsdtWithdrawal,
          usdtRate: usdtToPkrRate || 295,
          usdtAmount: isUsdtWithdrawal
            ? withdrawalAmount / (usdtToPkrRate || 295)
            : null,
          usdtNetworkFee: isUsdtWithdrawal
            ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.05
            : null,
          usdtAmountAfterFee: isUsdtWithdrawal
            ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.95
            : null,
        }),
      },
    });

    // Log the withdrawal request activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: "withdrawal_request",
        description: isUsdtWithdrawal
          ? `User requested USDT withdrawal equivalent to PKR ${withdrawalAmount} from ${walletType}`
          : `User requested withdrawal of PKR ${withdrawalAmount} from ${walletType}`,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        metadata: JSON.stringify({
          withdrawalRequestId: withdrawalRequest.id,
          amount: withdrawalAmount,
          handlingFee: handlingFee,
          walletType: walletType,
          paymentMethod: bankCard.bankName,
          accountNumber: bankCard.accountNumber,
          isUsdtWithdrawal: isUsdtWithdrawal,
          usdtRate: usdtToPkrRate || 295,
          usdtAmount: isUsdtWithdrawal
            ? withdrawalAmount / (usdtToPkrRate || 295)
            : null,
          usdtNetworkFee: isUsdtWithdrawal
            ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.05
            : null,
          usdtAmountAfterFee: isUsdtWithdrawal
            ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.95
            : null,
        }),
      },
    });

    // Get user details for notification
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, phone: true, email: true },
    });

    // Create admin notification for withdrawal request
    try {
      await notificationService.createNotification(
        NotificationType.WITHDRAWAL_REQUEST,
        "New Withdrawal Request",
        isUsdtWithdrawal
          ? `User ${userDetails?.name || userDetails?.phone || user.id} has requested USDT withdrawal equivalent to PKR ${withdrawalAmount}`
          : `User ${userDetails?.name || userDetails?.phone || user.id} has requested withdrawal of PKR ${withdrawalAmount}`,
        {
          severity: NotificationSeverity.INFO,
          targetType: "admin",
          targetId: "all",
          actionUrl: `/admin/withdrawal-management?request=${withdrawalRequest.id}`,
          metadata: {
            withdrawalRequestId: withdrawalRequest.id,
            userId: user.id,
            userName: userDetails?.name,
            userPhone: userDetails?.phone,
            amount: withdrawalAmount,
            handlingFee: handlingFee,
            walletType: walletType,
            paymentMethod: bankCard.bankName,
            accountNumber: bankCard.accountNumber,
            status: "PENDING",
            isUsdtWithdrawal: isUsdtWithdrawal,
            usdtRate: usdtToPkrRate || 295,
            usdtAmount: isUsdtWithdrawal
              ? withdrawalAmount / (usdtToPkrRate || 295)
              : null,
            usdtNetworkFee: isUsdtWithdrawal
              ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.05
              : null,
            usdtAmountAfterFee: isUsdtWithdrawal
              ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.95
              : null,
          },
        },
      );
    } catch (notificationError) {
      console.error("Failed to create admin notification:", notificationError);
      // Don't fail the withdrawal if notification fails
    }

    // Create user notification for withdrawal request submission
    try {
      await NotificationService.createNotification(
        {
          type: "WITHDRAWAL_REQUEST",
          title: "Withdrawal Request Submitted",
          message: isUsdtWithdrawal
            ? `Your USDT withdrawal request equivalent to PKR ${withdrawalAmount} has been submitted successfully. Processing time: 0-30 minutes.`
            : `Your withdrawal request of PKR ${withdrawalAmount} has been submitted successfully. Processing time: 0-72 hours.`,
          severity: "SUCCESS",
          actionUrl: `/withdraw`,
          metadata: {
            withdrawalRequestId: withdrawalRequest.id,
            amount: withdrawalAmount,
            handlingFee: handlingFee,
            walletType: walletType,
            paymentMethod: `${bankCard.bankName} ${bankCard.accountNumber}`,
            status: "PENDING",
            estimatedProcessingTime: isUsdtWithdrawal
              ? "0-30 minutes"
              : "0-72 hours",
            isUsdtWithdrawal: isUsdtWithdrawal,
            usdtRate: usdtToPkrRate || 295,
            usdtAmount: isUsdtWithdrawal
              ? withdrawalAmount / (usdtToPkrRate || 295)
              : null,
            usdtNetworkFee: isUsdtWithdrawal
              ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.05
              : null,
            usdtAmountAfterFee: isUsdtWithdrawal
              ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.95
              : null,
          },
        },
        user.id,
      );
    } catch (userNotificationError) {
      console.error(
        "Failed to create user notification:",
        userNotificationError,
      );
      // Don't fail the withdrawal if notification fails
    }

    response = NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      showSuccessModal: true,
      modalData: {
        title: isUsdtWithdrawal
          ? "USDT Withdrawal Submitted Successfully!"
          : "Withdrawal Submitted Successfully!",
        message: isUsdtWithdrawal
          ? "Your USDT withdrawal application has been submitted and will be processed within 0-30 minutes."
          : "Your withdrawal application has been submitted and will arrive to your account within 0-72 hours.",
        amount: withdrawalAmount,
        paymentMethod: `${bankCard.bankName} ${isUsdtWithdrawal ? bankCard.accountNumber.slice(0, 8) + "..." + bankCard.accountNumber.slice(-8) : bankCard.accountNumber}`,
        estimatedTime: isUsdtWithdrawal ? "0-30 minutes" : "0-72 hours",
        isUsdtWithdrawal: isUsdtWithdrawal,
        usdtAmount: isUsdtWithdrawal
          ? withdrawalAmount / (usdtToPkrRate || 295)
          : null,
        usdtNetworkFee: isUsdtWithdrawal
          ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.05
          : null,
        usdtAmountAfterFee: isUsdtWithdrawal
          ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.95
          : null,
      },
      data: {
        withdrawalRequestId: withdrawalRequest.id,
        amount: withdrawalAmount,
        handlingFee: handlingFee,
        totalDeduction: totalDeduction,
        paymentMethod: `${bankCard.bankName} ${isUsdtWithdrawal ? bankCard.accountNumber.slice(0, 8) + "..." + bankCard.accountNumber.slice(-8) : bankCard.accountNumber}`,
        status: "PENDING",
        estimatedProcessingTime: isUsdtWithdrawal
          ? "0-30 minutes"
          : "0-72 hours",
        isUsdtWithdrawal: isUsdtWithdrawal,
        usdtRate: usdtToPkrRate || 295,
        usdtAmount: isUsdtWithdrawal
          ? withdrawalAmount / (usdtToPkrRate || 295)
          : null,
        usdtNetworkFee: isUsdtWithdrawal
          ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.05
          : null,
        usdtAmountAfterFee: isUsdtWithdrawal
          ? (withdrawalAmount / (usdtToPkrRate || 295)) * 0.95
          : null,
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Withdrawal request error:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
