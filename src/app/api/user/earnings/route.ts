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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get yesterday's date range
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get start of current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Get start of next week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Get start of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get start of next month
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Fetch transactions for different periods
    const [todayTransactions, yesterdayTransactions, weekTransactions, monthTransactions] = await Promise.all([
      db.walletTransaction.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          type: {
            in: ['TASK_INCOME', 'REFERRAL_REWARD_A', 'REFERRAL_REWARD_B', 'REFERRAL_REWARD_C', 'MANAGEMENT_BONUS_A', 'MANAGEMENT_BONUS_B', 'MANAGEMENT_BONUS_C']
          }
        }
      }),
      db.walletTransaction.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: yesterday,
            lt: today
          },
          type: {
            in: ['TASK_INCOME', 'REFERRAL_REWARD_A', 'REFERRAL_REWARD_B', 'REFERRAL_REWARD_C', 'MANAGEMENT_BONUS_A', 'MANAGEMENT_BONUS_B', 'MANAGEMENT_BONUS_C']
          }
        }
      }),
      db.walletTransaction.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: startOfWeek,
            lt: endOfWeek
          },
          type: {
            in: ['TASK_INCOME', 'REFERRAL_REWARD_A', 'REFERRAL_REWARD_B', 'REFERRAL_REWARD_C', 'MANAGEMENT_BONUS_A', 'MANAGEMENT_BONUS_B', 'MANAGEMENT_BONUS_C']
          }
        }
      }),
      db.walletTransaction.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth
          },
          type: {
            in: ['TASK_INCOME', 'REFERRAL_REWARD_A', 'REFERRAL_REWARD_B', 'REFERRAL_REWARD_C', 'MANAGEMENT_BONUS_A', 'MANAGEMENT_BONUS_B', 'MANAGEMENT_BONUS_C']
          }
        }
      })
    ]);

    // Calculate earnings for each period
    const calculateEarnings = (transactions: any[]) => {
      return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    };

    const earningsData = {
      today: calculateEarnings(todayTransactions),
      yesterday: calculateEarnings(yesterdayTransactions),
      thisWeek: calculateEarnings(weekTransactions),
      thisMonth: calculateEarnings(monthTransactions)
    };

    return NextResponse.json(earningsData);

  } catch (error) {
    console.error('Get earnings data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}