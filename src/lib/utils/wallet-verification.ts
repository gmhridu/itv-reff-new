import { db } from "@/lib/db";

export interface WalletVerificationReport {
  userId: string;
  userPhone: string;
  currentData: {
    walletBalance: number;
    commissionBalance: number;
    totalEarnings: number;
    depositPaid: number;
  };
  calculatedData: {
    actualTotalEarnings: number;
    totalInviteCommissions: number;
    totalTaskCommissions: number;
    totalDailyTaskCommissions: number;
    totalTopupBonuses: number;
    totalSpecialCommissions: number;
    totalSecurityRefunds: number;
  };
  discrepancies: {
    totalEarningsDiscrepancy: number;
    hasDiscrepancies: boolean;
  };
  recommendations: string[];
}

export class WalletVerificationService {
  /**
   * Verify wallet calculations for a specific user
   */
  static async verifyUserWallet(userId: string): Promise<WalletVerificationReport> {
    try {
      // Get user data
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          phone: true,
          walletBalance: true,
          commissionBalance: true,
          totalEarnings: true,
          depositPaid: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Calculate actual earnings from transactions (ONLY the 5 specified types)
      const earningTransactions = await db.walletTransaction.findMany({
        where: {
          userId,
          type: {
            in: [
              "TASK_INCOME", // 1. Daily Task Commission
              "REFERRAL_REWARD_A", // 2. Referral Invite Commission - Level A (10%)
              "REFERRAL_REWARD_B", // 2. Referral Invite Commission - Level B (3%)
              "REFERRAL_REWARD_C", // 2. Referral Invite Commission - Level C (1%)
              "MANAGEMENT_BONUS_A", // 3. Referral Task Commission - Level A (8%)
              "MANAGEMENT_BONUS_B", // 3. Referral Task Commission - Level B (3%)
              "MANAGEMENT_BONUS_C", // 3. Referral Task Commission - Level C (1%)
              "TOPUP_BONUS", // 4. USDT Top-up Bonus (3%)
              "SPECIAL_COMMISSION", // 5. Special Commission
            ] as any,
          },
          status: "COMPLETED",
        },
      });

      // Calculate breakdown
      const totalDailyTaskCommissions = earningTransactions
        .filter((t) => t.type === "TASK_INCOME")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalInviteCommissions = earningTransactions
        .filter((t) =>
          ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"].includes(t.type),
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const totalTaskCommissions = earningTransactions
        .filter((t) =>
          ["MANAGEMENT_BONUS_A", "MANAGEMENT_BONUS_B", "MANAGEMENT_BONUS_C"].includes(t.type),
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const totalTopupBonuses = earningTransactions
        .filter((t) => t.type === "TOPUP_BONUS")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSpecialCommissions = earningTransactions
        .filter((t) => t.type === "SPECIAL_COMMISSION")
        .reduce((sum, t) => sum + t.amount, 0);

      const actualTotalEarnings = earningTransactions.reduce((sum, t) => sum + t.amount, 0);

      // Get security refunds (separate from earnings)
      let totalSecurityRefunds = 0;
      try {
        const securityRefunds = await db.securityRefundRequest.findMany({
          where: {
            userId,
            status: "APPROVED",
          },
        });

        totalSecurityRefunds = securityRefunds.reduce(
          (sum, refund) => sum + refund.refundAmount,
          0,
        );
      } catch (error) {
        console.warn("Security refund table not available:", error);
      }

      // Calculate discrepancies
      const totalEarningsDiscrepancy = Math.abs(user.totalEarnings - actualTotalEarnings);
      const hasDiscrepancies = totalEarningsDiscrepancy > 0.01; // Allow for small rounding differences

      // Generate recommendations
      const recommendations: string[] = [];

      if (hasDiscrepancies) {
        recommendations.push(
          `Total earnings discrepancy of PKR ${totalEarningsDiscrepancy.toFixed(2)} found. Consider running wallet correction.`,
        );
      }

      if (user.totalEarnings > actualTotalEarnings) {
        recommendations.push(
          "User's totalEarnings field is higher than calculated earnings. May include old incorrect data.",
        );
      }

      if (user.totalEarnings < actualTotalEarnings) {
        recommendations.push(
          "User's totalEarnings field is lower than calculated earnings. Transaction records may be incomplete.",
        );
      }

      if (totalInviteCommissions === 0 && totalTaskCommissions === 0) {
        recommendations.push("No referral commissions found. Check if referral system is working properly.");
      }

      return {
        userId,
        userPhone: user.phone,
        currentData: {
          walletBalance: user.walletBalance,
          commissionBalance: user.commissionBalance,
          totalEarnings: user.totalEarnings,
          depositPaid: user.depositPaid,
        },
        calculatedData: {
          actualTotalEarnings,
          totalInviteCommissions,
          totalTaskCommissions,
          totalDailyTaskCommissions,
          totalTopupBonuses,
          totalSpecialCommissions,
          totalSecurityRefunds,
        },
        discrepancies: {
          totalEarningsDiscrepancy,
          hasDiscrepancies,
        },
        recommendations,
      };
    } catch (error) {
      console.error("Error verifying user wallet:", error);
      throw error;
    }
  }

  /**
   * Verify wallet calculations for all users
   */
  static async verifyAllWallets(limit: number = 100): Promise<WalletVerificationReport[]> {
    const users = await db.user.findMany({
      select: { id: true },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const reports: WalletVerificationReport[] = [];

    for (const user of users) {
      try {
        const report = await this.verifyUserWallet(user.id);
        reports.push(report);
      } catch (error) {
        console.error(`Error verifying wallet for user ${user.id}:`, error);
      }
    }

    return reports;
  }

  /**
   * Fix wallet data for a specific user
   */
  static async fixUserWallet(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const report = await this.verifyUserWallet(userId);

      if (!report.discrepancies.hasDiscrepancies) {
        return {
          success: true,
          message: "No discrepancies found. Wallet data is correct.",
        };
      }

      // Update user's totalEarnings to match calculated value
      await db.user.update({
        where: { id: userId },
        data: {
          totalEarnings: report.calculatedData.actualTotalEarnings,
        },
      });

      return {
        success: true,
        message: `Wallet corrected. Total earnings updated from PKR ${report.currentData.totalEarnings.toFixed(2)} to PKR ${report.calculatedData.actualTotalEarnings.toFixed(2)}`,
      };
    } catch (error) {
      console.error("Error fixing user wallet:", error);
      return {
        success: false,
        message: `Error fixing wallet: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Generate summary report for all wallets
   */
  static async generateSystemSummary(): Promise<{
    totalUsers: number;
    usersWithDiscrepancies: number;
    totalEarningsInSystem: number;
    totalCalculatedEarnings: number;
    totalSecurityRefunds: number;
    averageEarnings: number;
    topEarners: Array<{ userId: string; phone: string; earnings: number }>;
  }> {
    try {
      const reports = await this.verifyAllWallets(1000); // Check up to 1000 users

      const totalUsers = reports.length;
      const usersWithDiscrepancies = reports.filter((r) => r.discrepancies.hasDiscrepancies).length;
      const totalEarningsInSystem = reports.reduce((sum, r) => sum + r.currentData.totalEarnings, 0);
      const totalCalculatedEarnings = reports.reduce(
        (sum, r) => sum + r.calculatedData.actualTotalEarnings,
        0,
      );
      const totalSecurityRefunds = reports.reduce(
        (sum, r) => sum + r.calculatedData.totalSecurityRefunds,
        0,
      );
      const averageEarnings = totalCalculatedEarnings / totalUsers;

      const topEarners = reports
        .sort((a, b) => b.calculatedData.actualTotalEarnings - a.calculatedData.actualTotalEarnings)
        .slice(0, 10)
        .map((r) => ({
          userId: r.userId,
          phone: r.userPhone,
          earnings: r.calculatedData.actualTotalEarnings,
        }));

      return {
        totalUsers,
        usersWithDiscrepancies,
        totalEarningsInSystem,
        totalCalculatedEarnings,
        totalSecurityRefunds,
        averageEarnings,
        topEarners,
      };
    } catch (error) {
      console.error("Error generating system summary:", error);
      throw error;
    }
  }

  /**
   * Check referral commission setup for a user
   */
  static async checkReferralSetup(userId: string): Promise<{
    hasReferralHierarchy: boolean;
    hierarchyLevels: Array<{ level: string; referrerId: string; referrerPhone: string }>;
    inviteCommissionsEarned: number;
    taskCommissionsEarned: number;
    directReferrals: number;
  }> {
    try {
      // Check referral hierarchy
      const hierarchy = await db.referralHierarchy.findMany({
        where: { userId },
        include: {
          referrer: {
            select: { phone: true },
          },
        },
        orderBy: { level: "asc" },
      });

      // Count direct referrals
      const directReferrals = await db.referralHierarchy.count({
        where: {
          referrerId: userId,
          level: "A_LEVEL",
        },
      });

      // Calculate commissions earned
      const [inviteCommissions, taskCommissions] = await Promise.all([
        db.walletTransaction.aggregate({
          where: {
            userId,
            type: {
              in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
            },
            status: "COMPLETED",
          },
          _sum: { amount: true },
        }),
        db.walletTransaction.aggregate({
          where: {
            userId,
            type: {
              in: ["MANAGEMENT_BONUS_A", "MANAGEMENT_BONUS_B", "MANAGEMENT_BONUS_C"],
            },
            status: "COMPLETED",
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        hasReferralHierarchy: hierarchy.length > 0,
        hierarchyLevels: hierarchy.map((h) => ({
          level: h.level,
          referrerId: h.referrerId,
          referrerPhone: h.referrer.phone,
        })),
        inviteCommissionsEarned: inviteCommissions._sum.amount || 0,
        taskCommissionsEarned: taskCommissions._sum.amount || 0,
        directReferrals,
      };
    } catch (error) {
      console.error("Error checking referral setup:", error);
      throw error;
    }
  }
}
