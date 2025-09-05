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

    const positions = await PositionService.getAllPositions();

    const positionsWithIncome = positions.map(position => {
      const income = PositionService.calculateIncome(position);
      return {
        id: position.id,
        name: position.name,
        level: position.level,
        deposit: position.deposit,
        tasksPerDay: position.tasksPerDay,
        unitPrice: position.unitPrice,
        validityDays: position.validityDays,
        dailyIncome: income.dailyIncome,
        monthlyIncome: income.monthlyIncome,
        annualIncome: income.annualIncome,
        isActive: position.isActive
      };
    });

    return NextResponse.json({
      positions: positionsWithIncome
    });

  } catch (error) {
    console.error('Get positions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
