import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const plans = await db.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    return NextResponse.json({
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        durationDays: plan.durationDays,
        dailyVideoLimit: plan.dailyVideoLimit,
        rewardPerVideo: plan.rewardPerVideo,
        referralBonus: plan.referralBonus,
      }))
    });

  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, durationDays, dailyVideoLimit, rewardPerVideo, referralBonus } = body;

    // Validate input
    if (!name || !price || !durationDays || !dailyVideoLimit || !rewardPerVideo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plan = await db.plan.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
        dailyVideoLimit: parseInt(dailyVideoLimit),
        rewardPerVideo: parseFloat(rewardPerVideo),
        referralBonus: parseFloat(referralBonus) || 0,
      }
    });

    return NextResponse.json({
      message: 'Plan created successfully',
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        durationDays: plan.durationDays,
        dailyVideoLimit: plan.dailyVideoLimit,
        rewardPerVideo: plan.rewardPerVideo,
        referralBonus: plan.referralBonus,
      }
    });

  } catch (error) {
    console.error('Create plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}