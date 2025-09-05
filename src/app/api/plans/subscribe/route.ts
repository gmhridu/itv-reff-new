import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, paymentMethod, paymentDetails } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Get the plan
    const plan = await db.plan.findUnique({
      where: { id: planId, isActive: true }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Check if user already has an active plan
    const existingPlan = await db.userPlan.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: 'You already have an active plan' },
        { status: 400 }
      );
    }

    // In a real implementation, you would process the payment here
    // For now, we'll simulate successful payment
    const paymentSuccessful = true;

    if (!paymentSuccessful) {
      return NextResponse.json(
        { error: 'Payment failed' },
        { status: 400 }
      );
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
        status: 'ACTIVE'
      }
    });

    // Create transaction record
    await db.walletTransaction.create({
      data: {
        userId: user.id,
        type: 'DEBIT',
        amount: plan.price,
        balanceAfter: user.walletBalance - plan.price,
        description: `Plan subscription: ${plan.name}`,
        referenceId: `PLAN_${userPlan.id}`,
        status: 'COMPLETED'
      }
    });

    // Update user's wallet balance
    await db.user.update({
      where: { id: user.id },
      data: {
        walletBalance: user.walletBalance - plan.price
      }
    });

    return NextResponse.json({
      message: 'Subscription successful',
      subscription: {
        id: userPlan.id,
        planName: plan.name,
        startDate: userPlan.startDate,
        endDate: userPlan.endDate,
        amountPaid: userPlan.amountPaid,
        status: userPlan.status
      }
    });

  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
