import { db } from "@/lib/db";
import { ReferralLevel } from "@prisma/client";

export interface BonusDistributionResult {
  success: boolean;
  totalBonusDistributed: number;
  bonusBreakdown: {
    aLevel?: { userId: string; amount: number };
    bLevel?: { userId: string; amount: number };
    cLevel?: { userId: string; amount: number };
  };
}

export interface ManagementBonusStats {
  dailyBonuses: {
    aLevel: number;
    bLevel: number;
    cLevel: number;
    total: number;
  };
  monthlyBonuses: {
    aLevel: number;
    bLevel: number;
    cLevel: number;
    total: number;
  };
  subordinateCount: {
    aLevel: number;
    bLevel: number;
    cLevel: number;
    total: number;
  };
}

export interface SubordinateActivity {
  subordinateId: string;
  subordinateName: string;
  subordinateEmail: string;
  level: ReferralLevel;
  todayBonuses: number;
  monthlyBonuses: number;
  lastActivityDate: Date | null;
}

export class TaskManagementBonusService {
  private static readonly BONUS_RATES = {
    A_LEVEL: 0.08, // 8%
    B_LEVEL: 0.03, // 3%
    C_LEVEL: 0.01, // 1%
  };

  static async distributeManagementBonuses(
    subordinateUserId: string,
    taskIncome: number,
    taskDate: Date = new Date()
  ): Promise<BonusDistributionResult> {
    try {
      // Check if the user who completed the task is an intern
      const subordinateUser = await db.user.findUnique({
        where: { id: subordinateUserId },
        select: { isIntern: true }
      });

      // If the subordinate is an intern, skip management bonus distribution
      if (subordinateUser?.isIntern) {
        return {
          success: true,
          totalBonusDistributed: 0,
          bonusBreakdown: {}
        };
      }

      // Get the subordinate's upline hierarchy
      const hierarchy = await db.referralHierarchy.findMany({
        where: { userId: subordinateUserId },
        include: {
          referrer: {
            include: {
              currentPosition: true,
            },
          },
        },
      });

      const result: BonusDistributionResult = {
        success: true,
        totalBonusDistributed: 0,
        bonusBreakdown: {},
      };

      for (const hierarchyEntry of hierarchy) {
        const referrer = hierarchyEntry.referrer;

        // Skip if referrer doesn't have an active position or is Intern
        if (
          !referrer.currentPosition ||
          referrer.currentPosition.name === "Intern"
        ) {
          continue;
        }

        // Check if referrer's position is still active
        const isPositionActive = referrer.positionEndDate
          ? new Date() <= referrer.positionEndDate
          : false;

        if (!isPositionActive && referrer.currentPosition.name !== "Intern") {
          continue;
        }

        const bonusRate = this.BONUS_RATES[hierarchyEntry.level];
        const bonusAmount = Math.round(taskIncome * bonusRate);

        if (bonusAmount > 0) {
          await this.awardManagementBonus(
            referrer.id,
            subordinateUserId,
            hierarchyEntry.level,
            bonusAmount,
            taskIncome,
            taskDate
          );

          result.totalBonusDistributed += bonusAmount;

          if (hierarchyEntry.level === "A_LEVEL") {
            result.bonusBreakdown.aLevel = {
              userId: referrer.id,
              amount: bonusAmount,
            };
          } else if (hierarchyEntry.level === "B_LEVEL") {
            result.bonusBreakdown.bLevel = {
              userId: referrer.id,
              amount: bonusAmount,
            };
          } else if (hierarchyEntry.level === "C_LEVEL") {
            result.bonusBreakdown.cLevel = {
              userId: referrer.id,
              amount: bonusAmount,
            };
          }
        }
      }

      return result;
    } catch (error) {
      console.error("Error distributing management bonuses:", error);
      return {
        success: false,
        totalBonusDistributed: 0,
        bonusBreakdown: {},
      };
    }
  }

  private static async awardManagementBonus(
    userId: string,
    subordinateId: string,
    subordinateLevel: ReferralLevel,
    bonusAmount: number,
    taskIncome: number,
    taskDate: Date
  ): Promise<void> {
    const transactionType =
      subordinateLevel === "A_LEVEL"
        ? "MANAGEMENT_BONUS_A"
        : subordinateLevel === "B_LEVEL"
        ? "MANAGEMENT_BONUS_B"
        : "MANAGEMENT_BONUS_C";

    await db.$transaction(async (tx) => {
      // Update user's balance (only add to totalEarnings, not walletBalance)
      await tx.user.update({
        where: { id: userId },
        data: {
          totalEarnings: { increment: bonusAmount },
        },
      });

      // Get updated balance
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      // Create management bonus record
      await tx.taskManagementBonus.create({
        data: {
          userId,
          subordinateId,
          subordinateLevel,
          bonusAmount,
          taskIncome,
          taskDate,
        },
      });

      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          userId,
          type: transactionType,
          amount: bonusAmount,
          balanceAfter: updatedUser!.walletBalance,
          description: `${subordinateLevel.replace(
            "_",
            "-"
          )} Management Bonus from subordinate task completion`,
          referenceId: `MGMT_BONUS_${subordinateLevel}_${subordinateId}_${Date.now()}`,
          status: "COMPLETED",
          metadata: JSON.stringify({
            subordinateId,
            subordinateLevel,
            taskIncome,
            bonusRate: this.BONUS_RATES[subordinateLevel],
            taskDate: taskDate.toISOString(),
          }),
        },
      });
    });
  }

  static async getManagementBonusStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ManagementBonusStats> {
    try {
      const now = new Date();
      const defaultStartDate =
        startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const defaultEndDate =
        endDate ||
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      // Get daily bonuses
      const dailyBonuses = await db.taskManagementBonus.groupBy({
        by: ["subordinateLevel"],
        where: {
          userId,
          taskDate: {
            gte: defaultStartDate,
            lt: defaultEndDate,
          },
        },
        _sum: { bonusAmount: true },
      });

      // Get monthly bonuses
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const monthlyBonuses = await db.taskManagementBonus.groupBy({
        by: ["subordinateLevel"],
        where: {
          userId,
          taskDate: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        _sum: { bonusAmount: true },
      });

      // Get subordinate counts
      const subordinateCounts = await db.referralHierarchy.groupBy({
        by: ["level"],
        where: { referrerId: userId },
        _count: true,
      });

      const dailyBonusMap = dailyBonuses.reduce((acc, item) => {
        acc[item.subordinateLevel] = item._sum.bonusAmount || 0;
        return acc;
      }, {} as Record<string, number>);

      const monthlyBonusMap = monthlyBonuses.reduce((acc, item) => {
        acc[item.subordinateLevel] = item._sum.bonusAmount || 0;
        return acc;
      }, {} as Record<string, number>);

      const subordinateCountMap = subordinateCounts.reduce((acc, item) => {
        acc[item.level] = item._count;
        return acc;
      }, {} as Record<string, number>);

      return {
        dailyBonuses: {
          aLevel: dailyBonusMap["A_LEVEL"] || 0,
          bLevel: dailyBonusMap["B_LEVEL"] || 0,
          cLevel: dailyBonusMap["C_LEVEL"] || 0,
          total:
            (dailyBonusMap["A_LEVEL"] || 0) +
            (dailyBonusMap["B_LEVEL"] || 0) +
            (dailyBonusMap["C_LEVEL"] || 0),
        },
        monthlyBonuses: {
          aLevel: monthlyBonusMap["A_LEVEL"] || 0,
          bLevel: monthlyBonusMap["B_LEVEL"] || 0,
          cLevel: monthlyBonusMap["C_LEVEL"] || 0,
          total:
            (monthlyBonusMap["A_LEVEL"] || 0) +
            (monthlyBonusMap["B_LEVEL"] || 0) +
            (monthlyBonusMap["C_LEVEL"] || 0),
        },
        subordinateCount: {
          aLevel: subordinateCountMap["A_LEVEL"] || 0,
          bLevel: subordinateCountMap["B_LEVEL"] || 0,
          cLevel: subordinateCountMap["C_LEVEL"] || 0,
          total:
            (subordinateCountMap["A_LEVEL"] || 0) +
            (subordinateCountMap["B_LEVEL"] || 0) +
            (subordinateCountMap["C_LEVEL"] || 0),
        },
      };
    } catch (error) {
      console.error("Error getting management bonus stats:", error);
      return {
        dailyBonuses: { aLevel: 0, bLevel: 0, cLevel: 0, total: 0 },
        monthlyBonuses: { aLevel: 0, bLevel: 0, cLevel: 0, total: 0 },
        subordinateCount: { aLevel: 0, bLevel: 0, cLevel: 0, total: 0 },
      };
    }
  }

  static async getSubordinateActivity(
    userId: string,
    limit: number = 10
  ): Promise<SubordinateActivity[]> {
    try {
      const hierarchy = await db.referralHierarchy.findMany({
        where: { referrerId: userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: limit,
      });

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      // For 12 AM reset, we check from start of day to now (not end of day)
      const todayEnd = now;
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const result: SubordinateActivity[] = [];

      for (const hierarchyEntry of hierarchy) {
        const [todayBonuses, monthlyBonuses, lastActivity] = await Promise.all([
          db.taskManagementBonus.aggregate({
            where: {
              userId,
              subordinateId: hierarchyEntry.user.id,
              taskDate: { gte: todayStart, lt: todayEnd },
            },
            _sum: { bonusAmount: true },
          }),
          db.taskManagementBonus.aggregate({
            where: {
              userId,
              subordinateId: hierarchyEntry.user.id,
              taskDate: { gte: monthStart },
            },
            _sum: { bonusAmount: true },
          }),
          db.taskManagementBonus.findFirst({
            where: {
              userId,
              subordinateId: hierarchyEntry.user.id,
            },
            orderBy: { taskDate: "desc" },
            select: { taskDate: true },
          }),
        ]);

        result.push({
          subordinateId: hierarchyEntry.user.id,
          subordinateName: hierarchyEntry.user.name || "Unknown",
          subordinateEmail: hierarchyEntry.user.email || "",
          level: hierarchyEntry.level,
          todayBonuses: todayBonuses._sum.bonusAmount || 0,
          monthlyBonuses: monthlyBonuses._sum.bonusAmount || 0,
          lastActivityDate: lastActivity?.taskDate || null,
        });
      }

      return result.sort((a, b) => {
        if (!a.lastActivityDate && !b.lastActivityDate) return 0;
        if (!a.lastActivityDate) return 1;
        if (!b.lastActivityDate) return -1;
        return b.lastActivityDate.getTime() - a.lastActivityDate.getTime();
      });
    } catch (error) {
      console.error("Error getting subordinate activity:", error);
      return [];
    }
  }
}
