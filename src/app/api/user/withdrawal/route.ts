import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";

import { db as prisma } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import {
  notificationService,
  NotificationType,
  NotificationSeverity,
} from "@/lib/admin/notification-service";
import { NotificationService } from "@/lib/notification-service";
import { withdrawalConfigService } from "@/lib/admin/withdrawal-config-service";
import { TransactionType, TransactionStatus } from "@prisma/client";

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
    const { walletType, amount, paymentMethodId, usdtToPkrRate } = body;

    // Validate required fields
    if (!walletType || !amount || !paymentMethodId) {
      response = NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Validate amount
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount)) {
      response = NextResponse.json(
        { error: "Invalid withdrawal amount" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get user data with full details
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userDetails) {
      response = NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    // Validate withdrawal using configuration service
    const validationResult = await withdrawalConfigService.validateWithdrawal(
      userDetails,
      withdrawalAmount,
      paymentMethodId
    );

    if (!validationResult.isValid) {
      response = NextResponse.json(
        { error: validationResult.error },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get payment method details
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

    // Get config for calculations
    const config = await withdrawalConfigService.getWithdrawalConfig();

    // Check if withdrawal method is enabled
    const isUsdtWithdrawal = bankCard.bankName === "USDT_TRC20";

    // Calculate withdrawal fees and amounts
    const calculation = await withdrawalConfigService.calculateWithdrawal(
      withdrawalAmount,
      isUsdtWithdrawal
    );

    const { handlingFee, totalDeduction, netAmount, usdtAmount, usdtAmountAfterFee } = calculation;

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
          usdtRate: config.usdtToPkrRate,
          usdtAmount: usdtAmount,
          usdtNetworkFee: config.usdtNetworkFee,
          usdtAmountAfterFee: usdtAmountAfterFee,
        }),
        status: "PENDING",
      },
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
            usdtRate: config.usdtToPkrRate,
            usdtAmount: usdtAmount,
            usdtNetworkFee: config.usdtNetworkFee,
            usdtAmountAfterFee: usdtAmountAfterFee,
          },
        },
      );
    } catch (notificationError) {
      console.error("Failed to create admin notification:", notificationError);
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
          ? `Your USDT withdrawal application has been submitted and will be processed within ${config.usdtProcessingTime}.`
          : `Your withdrawal application has been submitted and will arrive to your account within ${config.withdrawalProcessingTime}.`,
        amount: withdrawalAmount,
        paymentMethod: `${bankCard.bankName} ${isUsdtWithdrawal ? bankCard.accountNumber.slice(0, 8) + "..." + bankCard.accountNumber.slice(-8) : bankCard.accountNumber}`,
        estimatedTime: isUsdtWithdrawal
          ? config.usdtProcessingTime
          : config.withdrawalProcessingTime,
        isUsdtWithdrawal: isUsdtWithdrawal,
        usdtAmount: usdtAmount,
        usdtNetworkFee: config.usdtNetworkFee,
        usdtAmountAfterFee: usdtAmountAfterFee,
      },
      data: {
        withdrawalRequestId: withdrawalRequest.id,
        amount: withdrawalAmount,
        handlingFee: handlingFee,
        totalDeduction: totalDeduction,
        paymentMethod: `${bankCard.bankName} ${isUsdtWithdrawal ? bankCard.accountNumber.slice(0, 8) + "..." + bankCard.accountNumber.slice(-8) : bankCard.accountNumber}`,
        status: "PENDING",
        estimatedProcessingTime: isUsdtWithdrawal
          ? config.usdtProcessingTime
          : config.withdrawalProcessingTime,
        isUsdtWithdrawal: isUsdtWithdrawal,
        usdtRate: config.usdtToPkrRate,
        usdtAmount: usdtAmount,
        usdtNetworkFee: config.usdtNetworkFee,
        usdtAmountAfterFee: usdtAmountAfterFee,
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