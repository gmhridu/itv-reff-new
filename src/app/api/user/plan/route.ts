import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userPlan = await db.userPlan.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { plan: true }
    });

    if (!userPlan) {
      return NextResponse.json({
        hasActivePlan: false,
        message: 'No active plan found'
      });
    }

    return NextResponse.json({
      hasActivePlan: true,
      subscription: {
        id: userPlan.id,
        plan: {
          id: userPlan.plan.id,
          name: userPlan.plan.name,
          description: userPlan.plan.description,
          dailyVideoLimit: userPlan.plan.dailyVideoLimit,
          rewardPerVideo: userPlan.plan.rewardPerVideo,
          referralBonus: userPlan.plan.referralBonus,
        },
        startDate: userPlan.startDate,
        endDate: userPlan.endDate,
        amountPaid: userPlan.amountPaid,
        status: userPlan.status,
        daysRemaining: Math.ceil((userPlan.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    console.error('Get user plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
