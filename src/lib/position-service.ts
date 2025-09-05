import { db } from '@/lib/db';
import { PositionLevel, User } from '@prisma/client';

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

    const now = new Date();
    const isExpired = user.positionEndDate ? now > user.positionEndDate : false;
    const daysRemaining = user.positionEndDate
      ? Math.max(0, Math.ceil((user.positionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

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

      // Check if user can upgrade (must be sequential or same level)
      const currentLevel = user.currentPosition?.level || 0;
      if (targetPosition.level > currentLevel + 1) {
        return {
          success: false,
          message: 'Cannot skip position levels. Must upgrade sequentially.'
        };
      }

      // Check wallet balance for deposit
      if (user.walletBalance < targetPosition.deposit) {
        return {
          success: false,
          message: 'Insufficient wallet balance for deposit'
        };
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + targetPosition.validityDays);

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
            depositPaid: targetPosition.deposit,
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
    const now = new Date();

    const expiredUsers = await db.user.findMany({
      where: {
        positionEndDate: { lt: now },
        currentPositionId: { not: null }
      },
      include: { currentPosition: true }
    });

    for (const user of expiredUsers) {
      // Move expired users back to Intern
      const internPosition = await db.positionLevel.findUnique({
        where: { name: 'Intern' }
      });

      if (internPosition) {
        const newStartDate = new Date();
        const newEndDate = new Date();
        newEndDate.setDate(newStartDate.getDate() + internPosition.validityDays);

        await db.user.update({
          where: { id: user.id },
          data: {
            currentPositionId: internPosition.id,
            positionStartDate: newStartDate,
            positionEndDate: newEndDate,
            isIntern: true,
            depositPaid: 0
          }
        });

        console.log(`User ${user.email} position expired, moved to Intern`);
      }
    }
  }

  static async getDailyTasksCompleted(userId: string, date?: Date): Promise<number> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tasksCompleted = await db.userVideoTask.count({
      where: {
        userId,
        watchedAt: {
          gte: startOfDay,
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

    if (userPosition.isExpired) {
      return { canComplete: false, reason: 'Position has expired' };
    }

    const tasksCompleted = await this.getDailyTasksCompleted(userId);
    const tasksRemaining = userPosition.position.tasksPerDay - tasksCompleted;

    if (tasksRemaining <= 0) {
      return { canComplete: false, reason: 'Daily task limit reached' };
    }

    return { canComplete: true, tasksRemaining };
  }
}
