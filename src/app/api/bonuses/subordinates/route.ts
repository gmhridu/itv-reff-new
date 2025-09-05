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
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Get subordinate activity
    const subordinateActivity = await TaskManagementBonusService.getSubordinateActivity(
      user.id,
      limit
    );

    return NextResponse.json({
      subordinateActivity,
      totalSubordinates: subordinateActivity.length
    });

  } catch (error) {
    console.error('Get subordinate activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
