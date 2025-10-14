import { db } from '@/lib/db';
import { PositionLevel, User } from '@prisma/client';
import { getStartOfDayInTimezone, toUTCFromDateInTimezone } from '@/lib/timezone-utils';

export interface PositionIncomeCalculation {
  dailyIncome: number;
  monthlyIncome: number;
  annualIncome: number;
}

export interface PositionUpgradeResult {
  success: boolean;
  message: string;
  newPosition?: PositionLevel;
}

export class PositionService {

  static async getAllPositions(): Promise<PositionLevel[]> {
    return await db.positionLevel.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' }
    });
  }

  static async getPositionByLevel(level: number): Promise<PositionLevel | null> {
    return await db.positionLevel.findUnique({
      where: { level }
    });
  }

  static async getPositionByName(name: string): Promise<PositionLevel | null> {
    return await db.positionLevel.findUnique({
      where: { name }
    });
  }

  static calculateIncome(position: PositionLevel): PositionIncomeCalculation {
    const dailyIncome = position.tasksPerDay * position.unitPrice;
    const monthlyIncome = dailyIncome * 30;
    const annualIncome = dailyIncome * 365;

    return {
      dailyIncome,
      monthlyIncome,
      annualIncome
    };
  }

  static async getUserCurrentPosition(userId: string): Promise<{
    user: User;
    position: PositionLevel | null;
    isExpired: boolean;
    daysRemaining: number;
  } | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { currentPosition: true }
    });

    if (!user) return null;

    // Check if user is intern and has exceeded the 4-day limit
    if (user.isIntern && user.positionStartDate) {
      const startDate = new Date(user.positionStartDate);
      const currentDate = new Date();
      
      // Calculate the difference in days
      const timeDiff = currentDate.getTime() - startDate.getTime();
      const daysSinceStart = Math.floor(timeDiff / (1000 * 3600 * 24));
      
      // Intern position expires after 4 days (from day 5 onward, no tasks)
      if (daysSinceStart >= 4) {
        return {
          user,
          position: user.currentPosition,
          isExpired: true,
          daysRemaining: 0
        };
      } else {
        return {
          user,
          position: user.currentPosition,
          isExpired: false,
          daysRemaining: 4 - daysSinceStart
        };
      }
    }

    // For non-intern positions, they don't expire
    const isExpired = false;
    const daysRemaining = Infinity;

    return {
      user,
      position: user.currentPosition,
      isExpired,
      daysRemaining
    };
  }

  static async upgradePosition(
    userId: string,
    targetPositionId: string,
    depositAmount: number
  ): Promise<PositionUpgradeResult> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { currentPosition: true }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const targetPosition = await db.positionLevel.findUnique({
        where: { id: targetPositionId }
      });

      if (!targetPosition) {
        return { success: false, message: 'Target position not found' };
      }

      // Validate deposit amount
      if (depositAmount < targetPosition.deposit) {
        return {
          success: false,
          message: `Insufficient deposit. Required: ${targetPosition.deposit} PKR`
        };
      }

      // Check if user can upgrade (must be to a higher or same level)
      const currentLevel = user.currentPosition?.level || 0;
      if (targetPosition.level < currentLevel) {
        return {
          success: false,
          message: 'Cannot downgrade position levels. You can only upgrade to the same or a higher position level.'
        };
      }

      // Allow upgrading to any higher position, not just the next level
      // Removed the sequential upgrade restriction

      // Check wallet balance for deposit
      if (user.walletBalance < targetPosition.deposit) {
        return {
          success: false,
          message: 'Insufficient wallet balance for deposit'
        };
      }

      const startDate = new Date();
      // Since we're removing validityDays, we don't set an end date
      const endDate = null;

      // Perform upgrade transaction
      await db.$transaction(async (tx) => {
        // Deduct deposit from wallet
        await tx.user.update({
          where: { id: userId },
          data: {
            walletBalance: { decrement: targetPosition.deposit },
            currentPositionId: targetPosition.id,
            positionStartDate: startDate,
            positionEndDate: endDate,
            depositPaid: { increment: targetPosition.deposit }, // Add to existing deposit instead of overwriting
            isIntern: targetPosition.name === 'Intern'
          }
        });

        // Record deposit transaction
        await tx.walletTransaction.create({
          data: {
            userId,
            type: 'POSITION_DEPOSIT',
            amount: -targetPosition.deposit,
            balanceAfter: user.walletBalance - targetPosition.deposit,
            description: `Position upgrade to ${targetPosition.name}`,
            referenceId: `POSITION_UPGRADE_${targetPosition.name}_${userId}_${Date.now()}`,
            status: 'COMPLETED',
            metadata: JSON.stringify({
              positionId: targetPosition.id,
              positionName: targetPosition.name,
              previousPositionId: user.currentPositionId
            })
          }
        });
      });

      return {
        success: true,
        message: `Successfully upgraded to ${targetPosition.name}`,
        newPosition: targetPosition
      };

    } catch (error) {
      console.error('Position upgrade error:', error);
      return { success: false, message: 'Internal server error during upgrade' };
    }
  }

  static async checkAndExpirePositions(): Promise<void> {
    // Since we're removing validityDays, this function is no longer needed
    // Positions don't expire anymore
    return;
  }

  static async getDailyTasksCompleted(userId: string, date?: Date): Promise<number> {
    const targetDate = date || new Date();
    
    // Get the start of the current day in the configured timezone
    const startOfDay = getStartOfDayInTimezone(targetDate);
    
    // Convert to UTC for database query
    const startOfDayUTC = toUTCFromDateInTimezone(startOfDay);
    
    // For 12 AM reset, we check from start of day to now (not end of day)
    const endOfDay = targetDate;

    const tasksCompleted = await db.userVideoTask.count({
      where: {
        userId,
        watchedAt: {
          gte: startOfDayUTC,
          lte: endOfDay
        }
      }
    });

    return tasksCompleted;
  }

  static async canCompleteTask(userId: string): Promise<{
    canComplete: boolean;
    reason?: string;
    tasksRemaining?: number;
  }> {
    const userPosition = await this.getUserCurrentPosition(userId);

    if (!userPosition || !userPosition.position) {
      return { canComplete: false, reason: 'No active position found' };
    }

    if (userPosition.user.isIntern && userPosition.isExpired) {
      return { canComplete: false, reason: 'Intern position work duration expired. Please upgrade to continue earning.' };
    }

    const tasksCompleted = await this.getDailyTasksCompleted(userId);
    const tasksRemaining = userPosition.position.tasksPerDay - tasksCompleted;

    if (tasksRemaining <= 0) {
      return { canComplete: false, reason: 'Daily task limit reached' };
    }

    return { canComplete: true, tasksRemaining };
  }
}
