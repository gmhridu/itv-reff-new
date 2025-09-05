import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { TaskManagementBonusService } from '@/lib/task-management-bonus-service';

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') ?
      new Date(url.searchParams.get('startDate')!) : undefined;
    const endDate = url.searchParams.get('endDate') ?
      new Date(url.searchParams.get('endDate')!) : undefined;

    // Get management bonus statistics
    const bonusStats = await TaskManagementBonusService.getManagementBonusStats(
      user.id,
      startDate,
      endDate
    );

    return NextResponse.json({
      bonusStats
    });

  } catch (error) {
    console.error('Get management bonuses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
