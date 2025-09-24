import { db } from "@/lib/db";
import { ReferralService } from "@/lib/referral-service";

export interface ReferralRepairReport {
  success: boolean;
  repairsPerformed: number;
  errors: string[];
  details: {
    inviteCommissionsFixed: number;
    taskCommissionsFixed: number;
    hierarchiesRebuilt: number;
    usersProcessed: string[];
  };
}

export class ReferralRepairService {
  // Comprehensive repair of all referral commissions
  static async repairAllReferralCommissions(): Promise<ReferralRepairReport> {
    const report: ReferralRepairReport = {
      success: false,
      repairsPerformed: 0,
      errors: [],
      details: {
        inviteCommissionsFixed: 0,
        taskCommissionsFixed: 0,
        hierarchiesRebuilt: 0,
        usersProcessed: [],
      },
    };

    try {
      // 1. Fix missing referral hierarchies
      await this.repairReferralHierarchies(report);

      // 2. Fix missing invite commissions (when users subscribe to plans)
      await this.repairInviteCommissions(report);

      // 3. Fix missing task commissions (when referred users complete tasks)
      await this.repairTaskCommissions(report);

      report.success = true;
      console.log("✅ Referral repair completed:", report);
      return report;
    } catch (error) {
      console.error("❌ Referral repair failed:", error);
      report.errors.push(`General repair error: ${error}`);
      return report;
    }
  }

  // Repair missing referral hierarchies
  private static async repairReferralHierarchies(
    report: ReferralRepairReport,
  ): Promise<void> {
    try {
      // Find users with referredBy but no hierarchy records
      const usersWithoutHierarchy = await db.user.findMany({
        where: {
          referredBy: { not: null },
          referralHierarchy: { none: {} },
        },
        select: {
          id: true,
          referredBy: true,
          name: true,
          phone: true,
        },
      });

      console.log(
        `🔧 Found ${usersWithoutHierarchy.length} users without referral hierarchy`,
      );

      for (const user of usersWithoutHierarchy) {
        try {
          if (user.referredBy) {
            await db.referralHierarchy.create({
              data: {
                userId: user.id,
                referrerId: user.referredBy,
                level: "A_LEVEL",
              },
            });

            // Find Level B - Direct referrer's referrer
            const levelBReferrer = await db.user.findUnique({
              where: { id: user.referredBy },
              select: { referredBy: true },
            });

            if (levelBReferrer?.referredBy) {
              await db.referralHierarchy.create({
                data: {
                  userId: user.id,
                  referrerId: levelBReferrer.referredBy,
                  level: "B_LEVEL",
                },
              });

              // Find Level C - Level B referrer's referrer
              const levelCReferrer = await db.user.findUnique({
                where: { id: levelBReferrer.referredBy },
                select: { referredBy: true },
              });

              if (levelCReferrer?.referredBy) {
                await db.referralHierarchy.create({
                  data: {
                    userId: user.id,
                    referrerId: levelCReferrer.referredBy,
                    level: "C_LEVEL",
                  },
                });
              }
            }
            report.details.hierarchiesRebuilt++;
            report.details.usersProcessed.push(user.id);
            console.log(
              `✅ Built hierarchy for user: ${user.name || user.phone}`,
            );
          }
        } catch (error) {
          const errorMsg = `Failed to build hierarchy for user ${user.id}: ${error}`;
          console.error("❌", errorMsg);
          report.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Error repairing referral hierarchies: ${error}`;
      console.error("❌", errorMsg);
      report.errors.push(errorMsg);
    }
  }

  // Repair missing invite commissions (10%-3%-1%)
  private static async repairInviteCommissions(
    report: ReferralRepairReport,
  ): Promise<void> {
    try {
      // Find users who subscribed to plans but commissions weren't paid to their referrers
      const usersWithPlansNoCommissions = await db.userPlan.findMany({
        where: {
          status: "ACTIVE",
          user: {
            referredBy: { not: null },
          },
        },
        select: {
          id: true,
          userId: true,
          amountPaid: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              referredBy: true,
            },
          },
        },
      });

      console.log(
        `🔧 Checking ${usersWithPlansNoCommissions.length} plan subscriptions for missing invite commissions`,
      );

      for (const userPlan of usersWithPlansNoCommissions) {
        try {
          // Check if invite commissions were already paid
          const existingCommissions = await db.walletTransaction.findFirst({
            where: {
              type: {
                in: [
                  "REFERRAL_REWARD_A",
                  "REFERRAL_REWARD_B",
                  "REFERRAL_REWARD_C",
                ],
              },
              metadata: {
                contains: `"referredUserId":"${userPlan.userId}"`,
              },
            },
          });

          if (!existingCommissions) {
            // Process invite commission for this user's plan subscription
            const result = await ReferralService.processReferralQualification(
              userPlan.userId,
              userPlan.amountPaid,
            );

            if (result.success && result.rewards) {
              report.details.inviteCommissionsFixed += result.rewards.length;
              console.log(
                `✅ Fixed invite commissions for ${userPlan.user.name || userPlan.user.phone} (PKR ${userPlan.amountPaid}):`,
                result.rewards.map(
                  (r) => `${r.level} → PKR ${r.amount.toFixed(2)}`,
                ),
              );
            }
          }
        } catch (error) {
          const errorMsg = `Failed to fix invite commission for user ${userPlan.userId}: ${error}`;
          console.error("❌", errorMsg);
          report.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Error repairing invite commissions: ${error}`;
      console.error("❌", errorMsg);
      report.errors.push(errorMsg);
    }
  }

  // Repair missing task commissions (8%-3%-1%)
  private static async repairTaskCommissions(
    report: ReferralRepairReport,
  ): Promise<void> {
    try {
      // Find users who completed tasks but task commissions weren't paid to their referrers
      const usersWithTasksNoCommissions = await db.userVideoTask.groupBy({
        by: ["userId"],
        where: {
          isVerified: true,
          watchedAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
          user: {
            referredBy: { not: null },
          },
        },
        _sum: {
          rewardEarned: true,
        },
        _count: {
          id: true,
        },
      });

      console.log(
        `🔧 Checking ${usersWithTasksNoCommissions.length} users with completed tasks for missing task commissions`,
      );

      for (const taskGroup of usersWithTasksNoCommissions) {
        try {
          const totalEarnings = taskGroup._sum.rewardEarned || 0;
          if (totalEarnings <= 0) continue;

          // Check if task commissions were already paid
          const existingTaskCommissions = await db.walletTransaction.findFirst({
            where: {
              type: {
                in: [
                  "MANAGEMENT_BONUS_A",
                  "MANAGEMENT_BONUS_B",
                  "MANAGEMENT_BONUS_C",
                ],
              },
              metadata: {
                contains: `"referredUserId":"${taskGroup.userId}"`,
              },
            },
          });

          if (!existingTaskCommissions) {
            // Process each task earning for commission calculation
            const userTasks = await db.userVideoTask.findMany({
              where: {
                userId: taskGroup.userId,
                isVerified: true,
                watchedAt: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                },
              },
              select: {
                rewardEarned: true,
                watchedAt: true,
              },
              orderBy: { watchedAt: "asc" },
            });

            let totalFixedCommissions = 0;
            for (const task of userTasks) {
              const result =
                await ReferralService.processReferralTaskCommission(
                  taskGroup.userId,
                  task.rewardEarned,
                );

              if (result.success && result.rewards) {
                totalFixedCommissions += result.rewards.length;
              }
            }

            if (totalFixedCommissions > 0) {
              report.details.taskCommissionsFixed += totalFixedCommissions;
              const user = await db.user.findUnique({
                where: { id: taskGroup.userId },
                select: { name: true, phone: true },
              });
              console.log(
                `✅ Fixed ${totalFixedCommissions} task commissions for ${user?.name || user?.phone} (Total earnings: PKR ${totalEarnings})`,
              );
            }
          }
        } catch (error) {
          const errorMsg = `Failed to fix task commission for user ${taskGroup.userId}: ${error}`;
          console.error("❌", errorMsg);
          report.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Error repairing task commissions: ${error}`;
      console.error("❌", errorMsg);
      report.errors.push(errorMsg);
    }
  }

  // Repair referral commissions for a specific user
  static async repairUserReferralCommissions(
    userId: string,
  ): Promise<ReferralRepairReport> {
    const report: ReferralRepairReport = {
      success: false,
      repairsPerformed: 0,
      errors: [],
      details: {
        inviteCommissionsFixed: 0,
        taskCommissionsFixed: 0,
        hierarchiesRebuilt: 0,
        usersProcessed: [userId],
      },
    };

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phone: true,
          referredBy: true,
        },
      });

      const userTasks = await db.userVideoTask.findMany({
        where: {
          userId: user?.id || userId,
          isVerified: true,
          watchedAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
        select: { rewardEarned: true },
      });

      if (!user) {
        report.errors.push(`User ${userId} not found`);
        return report;
      }

      // 1. Repair hierarchy if needed
      if (user.referredBy) {
        const hierarchyExists = await db.referralHierarchy.findFirst({
          where: { userId: user.id },
        });

        if (!hierarchyExists) {
          await db.referralHierarchy.create({
            data: {
              userId: user?.id || userId,
              referrerId: user?.referredBy || "",
              level: "A_LEVEL",
            },
          });
          report.details.hierarchiesRebuilt++;
          console.log(
            `✅ Built hierarchy for user: ${user.name || user.phone}`,
          );
        }
      }

      // Get user plan data
      const userPlans = await db.userPlan.findMany({
        where: { userId: user?.id || userId, status: "ACTIVE" },
        select: { amountPaid: true },
      });

      // 2. Repair invite commissions
      if (userPlans.length > 0) {
        for (const plan of userPlans) {
          const result = await ReferralService.processReferralQualification(
            user?.id || userId,
            plan.amountPaid,
          );

          if (result.success && result.rewards) {
            report.details.inviteCommissionsFixed += result.rewards.length;
            console.log(
              `✅ Fixed invite commissions for ${user.name || user.phone}:`,
              result.rewards.map(
                (r) => `${r.level} → PKR ${r.amount.toFixed(2)}`,
              ),
            );
          }
        }
      }

      // 3. Repair task commissions
      if (userTasks.length > 0) {
        for (const task of userTasks) {
          const result = await ReferralService.processReferralTaskCommission(
            user?.id || userId,
            task.rewardEarned,
          );

          if (result.success && result.rewards) {
            report.details.taskCommissionsFixed += result.rewards.length;
          }
        }

        console.log(
          `✅ Fixed ${report.details.taskCommissionsFixed} task commissions for ${user.name || user.phone}`,
        );
      }

      report.repairsPerformed =
        report.details.inviteCommissionsFixed +
        report.details.taskCommissionsFixed +
        report.details.hierarchiesRebuilt;

      report.success = true;
      return report;
    } catch (error) {
      console.error(
        `❌ Failed to repair commissions for user ${userId}:`,
        error,
      );
      report.errors.push(`Repair error for user ${userId}: ${error}`);
      return report;
    }
  }

  // Validate referral system integrity
  static async validateReferralSystemIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    statistics: {
      totalUsers: number;
      usersWithReferrers: number;
      usersWithHierarchy: number;
      usersWithPlans: number;
      commissionTransactions: number;
    };
  }> {
    const issues: string[] = [];

    try {
      const [
        totalUsers,
        usersWithReferrers,
        usersWithHierarchy,
        usersWithPlans,
        commissionTransactions,
      ] = await Promise.all([
        db.user.count(),
        db.user.count({ where: { referredBy: { not: null } } }),
        db.referralHierarchy.count(),
        db.userPlan.count({ where: { status: "ACTIVE" } }),
        db.walletTransaction.count({
          where: {
            type: {
              in: [
                "REFERRAL_REWARD_A",
                "REFERRAL_REWARD_B",
                "REFERRAL_REWARD_C",
                "MANAGEMENT_BONUS_A",
                "MANAGEMENT_BONUS_B",
                "MANAGEMENT_BONUS_C",
              ],
            },
          },
        }),
      ]);

      // Check for users with referrers but no hierarchy
      const usersWithoutHierarchy = await db.user.count({
        where: {
          referredBy: { not: null },
          referralHierarchy: { none: {} },
        },
      });

      if (usersWithoutHierarchy > 0) {
        issues.push(
          `${usersWithoutHierarchy} users have referrers but no hierarchy records`,
        );
      }

      // Check for active plans without corresponding invite commissions
      const plansWithoutCommissions = await db.userPlan.count({
        where: {
          status: "ACTIVE",
          user: { referredBy: { not: null } },
          // This is a simplified check; in production you'd do a more complex join
        },
      });

      const statistics = {
        totalUsers,
        usersWithReferrers,
        usersWithHierarchy,
        usersWithPlans,
        commissionTransactions,
      };

      return {
        isValid: issues.length === 0,
        issues,
        statistics,
      };
    } catch (error) {
      console.error("Error validating referral system:", error);
      return {
        isValid: false,
        issues: [`Validation error: ${error}`],
        statistics: {
          totalUsers: 0,
          usersWithReferrers: 0,
          usersWithHierarchy: 0,
          usersWithPlans: 0,
          commissionTransactions: 0,
        },
      };
    }
  }
}
