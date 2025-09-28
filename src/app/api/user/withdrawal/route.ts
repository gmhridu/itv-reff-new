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

    // Validate withdrawal using configuration service
    const validationResult = await withdrawalConfigService.validateWithdrawal(
      user.id,
      withdrawalAmount,
      walletType,
      paymentMethodId,
    );

    if (!validationResult.isValid) {
      response = NextResponse.json(
        { error: validationResult.error },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Calculate individual commission balances (hierarchical order)
    const commissionTypes = [
      { type: TransactionType.TASK_INCOME, name: "Daily Task Commission" },
      { type: TransactionType.REFERRAL_REWARD_A, name: "Referral Invite Commission" },
      { type: TransactionType.REFERRAL_REWARD_B, name: "Referral Task Commission B" },
      { type: TransactionType.REFERRAL_REWARD_C, name: "Referral Task Commission C" },
      { type: TransactionType.TOPUP_BONUS, name: "USDT Top-up Bonus (3%)" },
      { type: TransactionType.SPECIAL_COMMISSION, name: "Special Commission" },
    ];

    // Calculate balance for each commission type
    const commissionBalances: { [key: string]: number } = {};
    let totalCommissionBalance = 0;

    for (const commission of commissionTypes) {
      const balance = await prisma.walletTransaction.aggregate({
        where: {
          userId: user.id,
          type: commission.type,
          status: "COMPLETED",
        },
        _sum: { amount: true },
      });

      const currentBalance = balance._sum.amount || 0;
      commissionBalances[commission.type] = Math.max(0, currentBalance);
      totalCommissionBalance += commissionBalances[commission.type];
    }

    // Get security refunds (calculated separately as last resort)
    let totalSecurityRefund = 0;
    try {
      const securityRefunds = await prisma.securityRefundRequest.aggregate({
        where: {
          userId: user.id,
          status: "APPROVED",
        },
        _sum: { refundAmount: true },
      });
      totalSecurityRefund = securityRefunds._sum.refundAmount || 0;

      // Also check for security refund transaction credits
      const securityRefundTransactions = await prisma.walletTransaction.aggregate({
        where: {
          userId: user.id,
          type: TransactionType.SECURITY_REFUND,
          status: "COMPLETED",
        },
        _sum: { amount: true },
      });
      totalSecurityRefund = Math.max(totalSecurityRefund, securityRefundTransactions._sum.amount || 0);
    } catch (error: any) {
      console.warn("Security refund calculation error:", error.message);
      totalSecurityRefund = 0;
    }

    const totalAvailableBalance = totalCommissionBalance + totalSecurityRefund;

    // Get withdrawal configuration
    const config = await withdrawalConfigService.getWithdrawalConfig();

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

    // Calculate fees and amounts using configuration service
    const isUsdtWithdrawal = bankCard.bankName === "USDT_TRC20";
    const calculation = await withdrawalConfigService.calculateWithdrawal(
      withdrawalAmount,
      isUsdtWithdrawal,
    );

    const { handlingFee, totalDeduction } = calculation;

    // Check if user has sufficient total balance
    if (totalAvailableBalance < totalDeduction) {
      response = NextResponse.json(
        {
          error: `Insufficient balance. Available: PKR ${totalAvailableBalance.toFixed(2)}, Required: PKR ${totalDeduction.toFixed(2)}`,
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
          usdtRate: config.usdtToPkrRate,
          usdtAmount: calculation.usdtAmount,
          usdtNetworkFee: config.usdtNetworkFee,
          usdtAmountAfterFee: calculation.usdtAmountAfterFee,
        }),
        status: "PENDING",
      },
    });

    // Implement hierarchical deduction system
    // Order: Daily Task → Referral Invite → Referral Task B → Referral Task C → USDT Bonus → Special → Security Refund

    let remainingDeduction = totalDeduction;
    const deductionBreakdown: { [key: string]: number } = {};

    // Step 1: Deduct from commission types in hierarchical order
    for (const commission of commissionTypes) {
      if (remainingDeduction <= 0) break;

      const availableBalance = commissionBalances[commission.type];
      if (availableBalance > 0) {
        const deductionAmount = Math.min(remainingDeduction, availableBalance);
        deductionBreakdown[commission.type] = deductionAmount;
        remainingDeduction -= deductionAmount;

        // Create deduction transaction directly
        await prisma.walletTransaction.create({
          data: {
            userId: user.id,
            type: commission.type,
            amount: -deductionAmount, // Negative for deduction
            balanceAfter: 0, // Not affecting walletBalance
            description: `Withdrawal deduction from ${commission.name} - ${isUsdtWithdrawal ? 'USDT' : bankCard.bankName}`,
            referenceId: `${commission.type.toLowerCase()}-deduction-${withdrawalRequest.id}`,
            status: TransactionStatus.COMPLETED,
            metadata: JSON.stringify({
              withdrawalRequestId: withdrawalRequest.id,
              deductionType: commission.type,
              commissionName: commission.name,
              originalBalance: availableBalance,
              deductionAmount: deductionAmount,
              balanceAfterDeduction: availableBalance - deductionAmount,
              isWithdrawalDeduction: true,
            }),
          },
        });
      }
    }

    // Step 2: If still amount remaining, deduct from Security Refund
    let securityRefundDeduction = 0;
    if (remainingDeduction > 0 && totalSecurityRefund > 0) {
      securityRefundDeduction = Math.min(remainingDeduction, totalSecurityRefund);
      deductionBreakdown["SECURITY_REFUND"] = securityRefundDeduction;
      remainingDeduction -= securityRefundDeduction;

      // Create security refund deduction transaction
      await prisma.walletTransaction.create({
        data: {
          userId: user.id,
          type: TransactionType.SECURITY_REFUND,
          amount: -securityRefundDeduction, // Negative for deduction
          balanceAfter: 0, // Not affecting walletBalance
          description: `Withdrawal deduction from Security Refund - ${isUsdtWithdrawal ? 'USDT' : bankCard.bankName}`,
          referenceId: `security-refund-deduction-${withdrawalRequest.id}`,
          status: TransactionStatus.COMPLETED,
          metadata: JSON.stringify({
            withdrawalRequestId: withdrawalRequest.id,
            deductionType: "security_refund",
            originalSecurityRefund: totalSecurityRefund,
            deductionAmount: securityRefundDeduction,
            securityRefundAfterDeduction: totalSecurityRefund - securityRefundDeduction,
            isWithdrawalDeduction: true,
          }),
        },
      });
    }

    // Verify we have enough balance for the withdrawal
    if (remainingDeduction > 0) {
      throw new Error(`Insufficient balance for withdrawal. Missing: PKR ${remainingDeduction.toFixed(2)}`);
    }

    // Store hierarchical deduction details in withdrawal request metadata
    const updatedPaymentDetails = {
      bankName: bankCard.bankName,
      accountNumber: bankCard.accountNumber,
      cardHolderName: bankCard.cardHolderName,
      walletType: walletType,
      handlingFee: handlingFee,
      isUsdtWithdrawal: isUsdtWithdrawal,
      usdtRate: config.usdtToPkrRate,
      usdtAmount: calculation.usdtAmount,
      usdtNetworkFee: config.usdtNetworkFee,
      usdtAmountAfterFee: calculation.usdtAmountAfterFee,
      hierarchicalDeductionDetails: {
        totalDeduction: totalDeduction,
        deductionBreakdown: deductionBreakdown,
        originalCommissionBalances: commissionBalances,
        originalSecurityRefund: totalSecurityRefund,
        commissionDeductionOrder: commissionTypes.map(c => ({
          type: c.type,
          name: c.name,
          originalBalance: commissionBalances[c.type],
          deducted: deductionBreakdown[c.type] || 0,
          balanceAfter: commissionBalances[c.type] - (deductionBreakdown[c.type] || 0),
        })),
        securityRefundDeduction: securityRefundDeduction,
        securityRefundAfter: totalSecurityRefund - securityRefundDeduction,
        totalAvailableBalance: totalAvailableBalance,
      },
    };

    // Update withdrawal request with detailed deduction information
    await prisma.withdrawalRequest.update({
      where: { id: withdrawalRequest.id },
      data: {
        paymentDetails: JSON.stringify(updatedPaymentDetails),
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
          usdtNetworkFee: isUsdtWithdrawal ? 0 : null,
          usdtAmountAfterFee: isUsdtWithdrawal
            ? withdrawalAmount / (usdtToPkrRate || 295)
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
            usdtRate: config.usdtToPkrRate,
            usdtAmount: calculation.usdtAmount,
            usdtNetworkFee: config.usdtNetworkFee,
            usdtAmountAfterFee: calculation.usdtAmountAfterFee,
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
              ? config.usdtProcessingTime
              : config.withdrawalProcessingTime,
            isUsdtWithdrawal: isUsdtWithdrawal,
            usdtRate: config.usdtToPkrRate,
            usdtAmount: calculation.usdtAmount,
            usdtNetworkFee: config.usdtNetworkFee,
            usdtAmountAfterFee: calculation.usdtAmountAfterFee,
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
          ? `Your USDT withdrawal application has been submitted and will be processed within ${config.usdtProcessingTime}.`
          : `Your withdrawal application has been submitted and will arrive to your account within ${config.withdrawalProcessingTime}.`,
        amount: withdrawalAmount,
        paymentMethod: `${bankCard.bankName} ${isUsdtWithdrawal ? bankCard.accountNumber.slice(0, 8) + "..." + bankCard.accountNumber.slice(-8) : bankCard.accountNumber}`,
        estimatedTime: isUsdtWithdrawal
          ? config.usdtProcessingTime
          : config.withdrawalProcessingTime,
        isUsdtWithdrawal: isUsdtWithdrawal,
        usdtAmount: calculation.usdtAmount,
        usdtNetworkFee: config.usdtNetworkFee,
        usdtAmountAfterFee: calculation.usdtAmountAfterFee,
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
        usdtAmount: calculation.usdtAmount,
        usdtNetworkFee: config.usdtNetworkFee,
        usdtAmountAfterFee: calculation.usdtAmountAfterFee,
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
