import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { PositionService } from '@/lib/position-service';

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userPosition = await PositionService.getUserCurrentPosition(user.id);

    if (!userPosition) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const tasksCompletedToday = await PositionService.getDailyTasksCompleted(user.id);
    const canCompleteTask = await PositionService.canCompleteTask(user.id);

    let positionInfo = null;
    if (userPosition.position) {
      const income = PositionService.calculateIncome(userPosition.position);
      positionInfo = {
        id: userPosition.position.id,
        name: userPosition.position.name,
        level: userPosition.position.level,
        deposit: userPosition.position.deposit,
        tasksPerDay: userPosition.position.tasksPerDay,
        unitPrice: userPosition.position.unitPrice,
        validityDays: userPosition.position.validityDays,
        dailyIncome: income.dailyIncome,
        monthlyIncome: income.monthlyIncome,
        annualIncome: income.annualIncome
      };
    }

    return NextResponse.json({
      currentPosition: positionInfo,
      positionStartDate: userPosition.user.positionStartDate,
      positionEndDate: userPosition.user.positionEndDate,
      depositPaid: userPosition.user.depositPaid,
      isIntern: userPosition.user.isIntern,
      isExpired: userPosition.isExpired,
      daysRemaining: userPosition.daysRemaining,
      tasksCompletedToday,
      canCompleteTask: canCompleteTask.canComplete,
      tasksRemaining: canCompleteTask.tasksRemaining || 0,
      taskCompletionReason: canCompleteTask.reason
    });

  } catch (error) {
    console.error('Get current position error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
