import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db } from "@/lib/db";
import { UserNotificationService } from "@/lib/user-notification-service";
import { ReferralService } from "@/lib/referral-service";

export async function POST(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { planId, paymentMethod, paymentDetails } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 },
      );
    }

    // Get the plan
    const plan = await db.plan.findUnique({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check if user already has an active plan
    const existingActivePlan = await db.userPlan.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
    });

    if (existingActivePlan) {
      return NextResponse.json(
        { error: "You already have an active plan" },
        { status: 400 },
      );
    }

    // Check if this is user's first ever subscription (for referral commission purposes)
    const isFirstSubscription =
      (await db.userPlan.findFirst({
        where: {
          userId: user.id,
        },
      })) === null;

    // In a real implementation, you would process the payment here
    // For now, we'll simulate successful payment
    const paymentSuccessful = true;

    if (!paymentSuccessful) {
      return NextResponse.json({ error: "Payment failed" }, { status: 400 });
    }

    // Calculate plan end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Create user plan
    const userPlan = await db.userPlan.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amountPaid: plan.price,
        startDate,
        endDate,
        status: "ACTIVE",
      },
    });

    // Get user with wallet balance for transaction
    const userWithBalance = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, walletBalance: true, depositPaid: true },
    });

    if (!userWithBalance) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has sufficient balance
    if (userWithBalance.walletBalance < plan.price) {
      return NextResponse.json(
        { error: "Insufficient wallet balance for plan subscription" },
        { status: 400 },
      );
    }

    // Create transaction record for plan subscription
    await db.walletTransaction.create({
      data: {
        userId: user.id,
        type: "DEBIT",
        amount: plan.price,
        balanceAfter: userWithBalance.walletBalance - plan.price,
        description: `Plan subscription: ${plan.name}`,
        referenceId: `PLAN_${userPlan.id}`,
        status: "COMPLETED",
      },
    });

    // Update user's wallet balance (deduct from Current Balance)
    // Update security deposited (add to Security Deposited)
    await db.user.update({
      where: { id: user.id },
      data: {
        walletBalance: userWithBalance.walletBalance - plan.price,
        depositPaid: userWithBalance.depositPaid + plan.price,
      },
    });

    // Note: Referral commissions are now handled on position upgrades, not plan subscriptions
    // This ensures one-time commission per referred user when they upgrade their position level
    console.log(
      `Plan subscription completed for user ${user.id}. Referral commissions will be given when user upgrades their position level.`,
    );

    // Send plan subscription notification
    try {
      await UserNotificationService.notifyPlanSubscription(
        user.id,
        plan.name,
        plan.price,
        `${plan.durationDays} days`,
        [
          `${plan.dailyVideoLimit} daily videos`,
          `PKR ${plan.rewardPerVideo} per video`,
          `${plan.referralBonus}% referral bonus`,
        ],
      );
      console.log(`Plan subscription notification sent to user ${user.id}`);
    } catch (notificationError) {
      console.error(
        "Failed to send plan subscription notification:",
        notificationError,
      );
    }

    return NextResponse.json({
      message: "Subscription successful",
      subscription: {
        id: userPlan.id,
        planName: plan.name,
        startDate: userPlan.startDate,
        endDate: userPlan.endDate,
        amountPaid: userPlan.amountPaid,
        status: userPlan.status,
      },
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
