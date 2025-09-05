import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { addAPISecurityHeaders } from '@/lib/security-headers';
import { db } from '@/lib/db';
import { PositionService } from '@/lib/position-service';
import { TaskManagementBonusService } from '@/lib/task-management-bonus-service';
import { EnhancedReferralService } from '@/lib/enhanced-referral-service';

export async function GET(request: NextRequest) {
  let response: NextResponse<any> = NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  try {
    const user = await authMiddleware(request);

    if (!user) {
      response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    // Get user's current position
    const userPosition = await PositionService.getUserCurrentPosition(user.id as string);

    if (!userPosition) {
      response = NextResponse.json(
        { error: 'User position not found' },
        { status: 404 }
      );
      return addAPISecurityHeaders(response);
    }

    // Get today's task completion data
    const tasksCompletedToday = await PositionService.getDailyTasksCompleted(user.id as string);
    const canCompleteTask = await PositionService.canCompleteTask(user.id as string);

    // Get today's earnings from tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = await db.userVideoTask.findMany({
      where: {
        userId: user.id,
        watchedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const taskEarningsToday = todayTasks.reduce((sum, task) => sum + task.rewardEarned, 0);

    // Get management bonus stats
    const managementBonusStats = await TaskManagementBonusService.getManagementBonusStats(user.id as string);

    // Get referral hierarchy stats
    const referralHierarchyStats = await EnhancedReferralService.getReferralHierarchyStats(user.id as string);

    // Get recent transactions with income stream breakdown
    const recentTransactions = await db.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Calculate income streams for today
    const todayTransactions = await db.walletTransaction.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const incomeStreams = {
      taskIncome: todayTransactions
        .filter(t => t.type === 'TASK_INCOME')
        .reduce((sum, t) => sum + t.amount, 0),
      referralRewards: todayTransactions
        .filter(t => ['REFERRAL_REWARD_A', 'REFERRAL_REWARD_B', 'REFERRAL_REWARD_C'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0),
      managementBonuses: todayTransactions
        .filter(t => ['MANAGEMENT_BONUS_A', 'MANAGEMENT_BONUS_B', 'MANAGEMENT_BONUS_C'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0)
    };

    const totalEarningsToday = incomeStreams.taskIncome + incomeStreams.referralRewards + incomeStreams.managementBonuses;

    // Calculate simple referral stats for dashboard cards
    const totalReferrals = referralHierarchyStats.aLevelCount + referralHierarchyStats.bLevelCount + referralHierarchyStats.cLevelCount;
    const totalReferralEarnings = referralHierarchyStats.totalEarnings.total;

    response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        walletBalance: user.walletBalance,
        totalEarnings: user.totalEarnings,
        referralCode: user.referralCode,
      },
      currentPosition: userPosition.position ? {
        id: userPosition.position.id,
        name: userPosition.position.name,
        level: userPosition.position.level,
        tasksPerDay: userPosition.position.tasksPerDay,
        unitPrice: userPosition.position.unitPrice,
        isExpired: userPosition.isExpired,
        daysRemaining: userPosition.daysRemaining
      } : null,
      todayProgress: {
        videosWatched: tasksCompletedToday,
        dailyLimit: userPosition.position?.tasksPerDay || 0,
        earningsToday: totalEarningsToday,
        canCompleteTask: canCompleteTask.canComplete,
        tasksRemaining: canCompleteTask.tasksRemaining || 0,
        incomeStreams
      },
      referralStats: {
        totalReferrals,
        referralEarnings: totalReferralEarnings
      },
      teamStats: {
        subordinateCount: managementBonusStats.subordinateCount,
        dailyManagementBonuses: managementBonusStats.dailyBonuses,
        monthlyManagementBonuses: managementBonusStats.monthlyBonuses,
        referralHierarchy: referralHierarchyStats
      },
      recentTransactions: recentTransactions.map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt.toISOString(),
      }))
    });

    return addAPISecurityHeaders(response);

  } catch (error) {
    console.error('Dashboard API error:', error);
    response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addAPISecurityHeaders(response);
  }
}
