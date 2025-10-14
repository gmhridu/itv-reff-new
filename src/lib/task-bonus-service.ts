/**
 * Task Bonus Commission Service
 *
 * Handles referral task commissions (bonus commissions) that are awarded
 * when referred users complete 100% of their daily tasks.
 *
 * Commission Structure:
 * - Level A (Direct): 8% of daily earnings
 * - Level B (2nd Level): 3% of daily earnings
 * - Level C (3rd Level): 1% of daily earnings
 */

import { db } from "@/lib/db";
import { TransactionType } from "@prisma/client";
import { getStartOfDayInTimezone, toUTCFromDateInTimezone } from "@/lib/timezone-utils";

interface TaskCompletionStatus {
  userId: string;
  tasksCompleted: number;
  tasksRequired: number;
  completionPercentage: number;
  dailyEarnings: number;
  isComplete: boolean;
}

interface BonusCommissionResult {
  success: boolean;
  rewards?: Array<{
    referrerId: string;
    referrerName?: string;
    level: string;
    amount: number;
    percentage: number;
  }>;
  message?: string;
  dailyEarnings?: number;
  completionStatus?: TaskCompletionStatus;
}

export class TaskBonusService {
  // Commission rates for task bonuses
  private static readonly COMMISSION_RATES = {
    A_LEVEL: 0.08, // 8%
    B_LEVEL: 0.03, // 3%
    C_LEVEL: 0.01, // 1%
  };

  /**
   * Check daily task completion status for a user
   */
  static async checkDailyTaskCompletion(
    userId: string,
    date?: Date
  ): Promise<TaskCompletionStatus> {
    const targetDate = date || new Date();
    
    // Get the start of the current day in the configured timezone
    const startOfDay = getStartOfDayInTimezone(targetDate);
    
    // Convert to UTC for database query
    const startOfDayUTC = toUTCFromDateInTimezone(startOfDay);
    
    // For 12 AM reset, we check from start of day to now (not end of day)
    const endOfDay = targetDate;

    try {
      // Get user with their plan and position information
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          userPlan: {
            include: {
              plan: true
            }
          },
          currentPosition: true
        }
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Determine required daily tasks
      let tasksRequired = 0;

      // Priority 1: Check user's plan daily limit
      if (user.userPlan?.status === 'ACTIVE' && user.userPlan.plan) {
        tasksRequired = user.userPlan.plan.dailyVideoLimit;
      }
      // Priority 2: Check position level tasks per day
      else if (user.currentPosition) {
        tasksRequired = user.currentPosition.tasksPerDay;
      }
      // Default fallback
      else {
        tasksRequired = 10; // Default daily task requirement
      }

      // Get completed tasks for the day
      const completedTasks = await db.userVideoTask.findMany({
        where: {
          userId,
          watchedAt: {
            gte: startOfDayUTC,
            lte: endOfDay
          },
          isVerified: true
        }
      });

      const tasksCompleted = completedTasks.length;
      const dailyEarnings = completedTasks.reduce((sum, task) => sum + task.rewardEarned, 0);
      const completionPercentage = tasksRequired > 0
        ? (tasksCompleted / tasksRequired) * 100
        : 0;

      return {
        userId,
        tasksCompleted,
        tasksRequired,
        completionPercentage,
        dailyEarnings,
        isComplete: completionPercentage >= 100
      };
    } catch (error) {
      console.error('Error checking daily task completion:', error);
      throw error;
    }
  }

  /**
   * Process bonus commissions for 100% task completion
   */
  static async processDailyTaskBonus(
    userId: string,
    date?: Date
  ): Promise<BonusCommissionResult> {
    try {
      // Check task completion status
      const completionStatus = await this.checkDailyTaskCompletion(userId, date);

      if (!completionStatus.isComplete) {
        return {
          success: false,
          message: `User completed only ${completionStatus.completionPercentage.toFixed(1)}% of daily tasks. 100% required for bonus.`,
          completionStatus
        };
      }

      if (completionStatus.dailyEarnings <= 0) {
        return {
          success: false,
          message: 'No earnings to distribute as bonus',
          completionStatus
        };
      }

      // Check if bonus already processed for this date (after 12 AM reset)
      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const existingBonus = await db.taskManagementBonus.findFirst({
        where: {
          subordinateId: userId,
          taskDate: {
            gte: startOfDay
          }
        }
      });

      if (existingBonus) {
        return {
          success: false,
          message: 'Task bonus already processed for this date',
          completionStatus
        };
      }

      // Check if the user who completed the task is an intern
      const subordinateUser = await db.user.findUnique({
        where: { id: userId },
        select: { isIntern: true }
      });

      if (subordinateUser?.isIntern) {
        return {
          success: true,
          message: 'Task bonus processed (no referral commissions for intern users)',
          dailyEarnings: completionStatus.dailyEarnings,
          completionStatus
        };
      }

      // Get user's referral hierarchy
      const hierarchyLevels = await db.referralHierarchy.findMany({
        where: { userId },
        include: {
          referrer: {
            select: { id: true, name: true, status: true, phone: true }
          }
        },
        orderBy: { level: 'asc' }
      });

      if (hierarchyLevels.length === 0) {
        return {
          success: false,
          message: 'No referral hierarchy found',
          completionStatus
        };
      }

      const rewards: Array<{
        referrerId: string;
        referrerName?: string;
        level: string;
        amount: number;
        percentage: number;
      }> = [];

      // Process bonus commission for each level
      for (const hierarchy of hierarchyLevels) {
        // Skip inactive referrers
        if (hierarchy.referrer.status !== 'ACTIVE') {
          console.log(`Skipping inactive referrer ${hierarchy.referrerId}`);
          continue;
        }

        const commissionRate = this.COMMISSION_RATES[hierarchy.level as keyof typeof this.COMMISSION_RATES];
        if (!commissionRate) {
          console.log(`No commission rate for level ${hierarchy.level}`);
          continue;
        }

        const commissionAmount = completionStatus.dailyEarnings * commissionRate;

        // Award the commission
        await this.awardTaskBonus(
          hierarchy.referrerId,
          userId,
          commissionAmount,
          hierarchy.level,
          completionStatus.dailyEarnings,
          targetDate
        );

        rewards.push({
          referrerId: hierarchy.referrerId,
          referrerName: hierarchy.referrer.name || hierarchy.referrer.phone,
          level: hierarchy.level,
          amount: commissionAmount,
          percentage: commissionRate * 100
        });
      }

      return {
        success: true,
        rewards,
        message: `Task bonus distributed to ${rewards.length} referrers`,
        dailyEarnings: completionStatus.dailyEarnings,
        completionStatus
      };
    } catch (error) {
      console.error('Error processing daily task bonus:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Award task bonus commission to a referrer
   */
  private static async awardTaskBonus(
    referrerId: string,
    subordinateId: string,
    commissionAmount: number,
    level: string,
    taskIncome: number,
    taskDate: Date
  ): Promise<void> {
    try {
      // Get subordinate info for transaction description
      const subordinate = await db.user.findUnique({
        where: { id: subordinateId },
        select: { name: true, phone: true }
      });

      // Use database transaction to ensure consistency
      await db.$transaction(async (tx) => {
        // Create task management bonus record
        await tx.taskManagementBonus.create({
          data: {
            userId: referrerId,
            subordinateId,
            subordinateLevel: level as any,
            bonusAmount: commissionAmount,
            taskDate,
            taskIncome
          }
        });

        // Update referrer's commission balance
        await tx.user.update({
          where: { id: referrerId },
          data: {
            commissionBalance: { increment: commissionAmount }
          }
        });

        // Get updated balance for transaction record
        const updatedReferrer = await tx.user.findUnique({
          where: { id: referrerId },
          select: { commissionBalance: true }
        });

        // Determine transaction type and level name
        const transactionType =
          level === 'A_LEVEL' ? 'MANAGEMENT_BONUS_A' :
          level === 'B_LEVEL' ? 'MANAGEMENT_BONUS_B' :
          'MANAGEMENT_BONUS_C';

        const levelName =
          level === 'A_LEVEL' ? 'Direct (8%)' :
          level === 'B_LEVEL' ? '2nd Level (3%)' :
          '3rd Level (1%)';

        // Create transaction record
        await tx.walletTransaction.create({
          data: {
            userId: referrerId,
            type: transactionType as TransactionType,
            amount: commissionAmount,
            balanceAfter: updatedReferrer!.commissionBalance,
            description: `Task Bonus Commission - ${levelName}: ${subordinate?.name || subordinate?.phone} completed 100% daily tasks (Earnings: PKR ${taskIncome})`,
            referenceId: `TASK_BONUS_${level}_${subordinateId}_${taskDate.getTime()}`,
            status: 'COMPLETED',
            metadata: JSON.stringify({
              subordinateId,
              level,
              taskIncome,
              commissionRate: `${this.COMMISSION_RATES[level as keyof typeof this.COMMISSION_RATES] * 100}%`,
              taskDate: taskDate.toISOString()
            })
          }
        });
      });

      console.log(`Task bonus awarded: ${referrerId} received PKR ${commissionAmount} from ${subordinateId}'s task completion`);
    } catch (error) {
      console.error('Error awarding task bonus:', error);
      throw error;
    }
  }

  /**
   * Process task bonuses for all eligible users for a given date
   */
  static async processDailyTaskBonusesForAllUsers(date?: Date): Promise<{
    processed: number;
    successful: number;
    failed: number;
    totalBonusDistributed: number;
  }> {
    const targetDate = date || new Date();
    
    // Get the start of the current day in the configured timezone
    const startOfDay = getStartOfDayInTimezone(targetDate);
    
    // Convert to UTC for database query
    const startOfDayUTC = toUTCFromDateInTimezone(startOfDay);
    
    // For 12 AM reset, we check from start of day to now (not end of day)
    const endOfDay = targetDate;

    let processed = 0;
    let successful = 0;
    let failed = 0;
    let totalBonusDistributed = 0;

    try {
      // Find all users who completed tasks today
      const usersWithTasks = await db.userVideoTask.findMany({
        where: {
          watchedAt: {
            gte: startOfDayUTC,
            lte: endOfDay
          },
          isVerified: true
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      });

      console.log(`Found ${usersWithTasks.length} users with tasks on ${targetDate.toDateString()}`);

      // Process each user
      for (const { userId } of usersWithTasks) {
        processed++;

        try {
          const result = await this.processDailyTaskBonus(userId, targetDate);

          if (result.success && result.rewards) {
            successful++;
            const totalBonus = result.rewards.reduce((sum, r) => sum + r.amount, 0);
            totalBonusDistributed += totalBonus;
            console.log(`✅ User ${userId}: Distributed PKR ${totalBonus} to ${result.rewards.length} referrers`);
          } else {
            console.log(`⚠️ User ${userId}: ${result.message}`);
          }
        } catch (error) {
          failed++;
          console.error(`❌ Failed to process user ${userId}:`, error);
        }
      }

      return {
        processed,
        successful,
        failed,
        totalBonusDistributed
      };
    } catch (error) {
      console.error('Error processing daily task bonuses:', error);
      throw error;
    }
  }

  /**
   * Get task bonus statistics for a user
   */
  static async getUserTaskBonusStats(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.taskDate = {};
      if (startDate) where.taskDate.gte = startDate;
      if (endDate) where.taskDate.lte = endDate;
    }

    const bonuses = await db.taskManagementBonus.findMany({
      where,
      include: {
        subordinate: {
          select: { name: true, phone: true }
        }
      },
      orderBy: { taskDate: 'desc' }
    });

    const totalBonus = bonuses.reduce((sum, b) => sum + b.bonusAmount, 0);
    const bonusByLevel = bonuses.reduce((acc, b) => {
      if (!acc[b.subordinateLevel]) {
        acc[b.subordinateLevel] = { count: 0, amount: 0 };
      }
      acc[b.subordinateLevel].count++;
      acc[b.subordinateLevel].amount += b.bonusAmount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return {
      totalBonuses: bonuses.length,
      totalAmount: totalBonus,
      byLevel: bonusByLevel,
      recentBonuses: bonuses.slice(0, 10)
    };
  }
}
