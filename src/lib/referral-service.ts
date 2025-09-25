import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export interface ReferralTrackingData {
  referralCode: string;
  ipAddress: string;
  userAgent: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface ReferralReward {
  id: string;
  name: string;
  triggerEvent: string;
  rewardAmount: number;
  isActive: boolean;
}

export class ReferralService {
  // Track referral click/visit
  static async trackReferralVisit(
    data: ReferralTrackingData,
  ): Promise<{ success: boolean; activityId?: string }> {
    try {
      // Find the referrer by referral code
      const referrer = await db.user.findUnique({
        where: { referralCode: data.referralCode },
        select: { id: true, status: true },
      });

      if (!referrer || referrer.status !== "ACTIVE") {
        return { success: false };
      }

      // Check if there's already a recent activity from this IP
      const existingActivity = await db.referralActivity.findFirst({
        where: {
          referrerId: referrer.id,
          referralCode: data.referralCode,
          ipAddress: data.ipAddress,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
          },
        },
      });

      if (existingActivity) {
        return { success: true, activityId: existingActivity.id };
      }

      // Create new referral activity
      const activity = await db.referralActivity.create({
        data: {
          referrerId: referrer.id,
          referralCode: data.referralCode,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          source: data.source,
          status: "PENDING",
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      return { success: true, activityId: activity.id };
    } catch (error) {
      console.error("Error tracking referral visit:", error);
      return { success: false };
    }
  }

  // Process referral registration - this is when user signs up with referral code
  static async processReferralRegistration(
    referralCode: string,
    newUserId: string,
    ipAddress: string,
  ): Promise<{ success: boolean; rewardAmount?: number }> {
    try {
      // Find the referrer
      const referrer = await db.user.findUnique({
        where: { referralCode },
        select: { id: true, status: true },
      });

      if (!referrer || referrer.status !== "ACTIVE") {
        return { success: false };
      }

      // Update the new user's referredBy field
      await db.user.update({
        where: { id: newUserId },
        data: { referredBy: referrer.id },
      });

      // Build referral hierarchy (multi-level structure)
      await ReferralService.buildReferralHierarchy(newUserId, referrer.id);

      // Update or create referral activity
      const activity = await db.referralActivity.findFirst({
        where: {
          referrerId: referrer.id,
          referralCode,
          ipAddress,
          status: "PENDING",
        },
      });

      if (activity) {
        await db.referralActivity.update({
          where: { id: activity.id },
          data: {
            referredUserId: newUserId,
            status: "REGISTERED",
          },
        });
      } else {
        await db.referralActivity.create({
          data: {
            referrerId: referrer.id,
            referredUserId: newUserId,
            referralCode,
            ipAddress,
            userAgent: "registration",
            source: "direct",
            status: "REGISTERED",
          },
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error processing referral registration:", error);
      return { success: false };
    }
  }

  // Process referral qualification (when referred user upgrades position level)
  static async processReferralQualification(
    userId: string,
    positionLevelName: string,
  ): Promise<{
    success: boolean;
    rewards?: Array<{
      referrerId: string;
      level: string;
      amount: number;
      type: "position_upgrade";
    }>;
    reason?: string;
  }> {
    try {
      // Check if this user has already given commission to referrers (one-time only)
      const existingCommissionTransactions = await db.walletTransaction.findMany({
        where: {
          type: {
            in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
          },
          status: "COMPLETED",
          metadata: {
            contains: `"referredUserId":"${userId}"`
          }
        },
      });

      if (existingCommissionTransactions.length > 0) {
        console.log(
          `User ${userId} has already given commission to referrers, no additional commissions will be given`,
        );
        return {
          success: false,
          reason: "User has already given commission to referrers - one-time only per referred user",
        };
      }

      // Find user's referral hierarchy
      const hierarchyLevels = await db.referralHierarchy.findMany({
        where: { userId },
        include: {
          referrer: {
            select: { id: true, name: true, status: true },
          },
        },
        orderBy: { level: "asc" },
      });

      // Check if commissions have already been given for this user by checking wallet transactions for referrers
      for (const hierarchy of hierarchyLevels) {
        const existingCommissionTransactions = await db.walletTransaction.findMany({
          where: {
            userId: hierarchy.referrerId,
            type: {
              in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
            },
            status: "COMPLETED",
          },
        });

        // Check if any of these transactions are for the current user
        for (const transaction of existingCommissionTransactions) {
          if (transaction.metadata) {
            try {
              const metadata = JSON.parse(transaction.metadata);
              if (metadata.referredUserId === userId) {
                console.log(
                  `Commissions already processed for user ${userId} by referrer ${hierarchy.referrerId}, existing transaction:`,
                  transaction,
                );
                return {
                  success: false,
                  reason: "Commissions have already been given for this referred user",
                };
              }
            } catch (error) {
              // If metadata parsing fails, continue checking
              continue;
            }
          }
        }
      }

      if (hierarchyLevels.length === 0) {
        return { success: false, reason: "No referral hierarchy found" };
      }

      const rewards: Array<{
        referrerId: string;
        level: string;
        amount: number;
        type: "position_upgrade";
      }> = [];

      // Position-based commission rates (one-time per referred user)
      const positionCommissionRates = {
        L1: { A_LEVEL: 200, B_LEVEL: 60, C_LEVEL: 20 },
        L2: { A_LEVEL: 500, B_LEVEL: 150, C_LEVEL: 50 },
        L3: { A_LEVEL: 2000, B_LEVEL: 600, C_LEVEL: 200 },
        L4: { A_LEVEL: 5000, B_LEVEL: 1500, C_LEVEL: 500 },
        L5: { A_LEVEL: 10000, B_LEVEL: 3000, C_LEVEL: 1000 },
        L6: { A_LEVEL: 25000, B_LEVEL: 7500, C_LEVEL: 2500 },
        L7: { A_LEVEL: 50000, B_LEVEL: 15000, C_LEVEL: 5000 },
        L8: { A_LEVEL: 100000, B_LEVEL: 30000, C_LEVEL: 10000 },
        L9: { A_LEVEL: 200000, B_LEVEL: 60000, C_LEVEL: 20000 },
        L10: { A_LEVEL: 400000, B_LEVEL: 120000, C_LEVEL: 40000 },
        L11: { A_LEVEL: 800000, B_LEVEL: 240000, C_LEVEL: 80000 },
      };

      // Get the commission rates for this position level
      const rates = positionCommissionRates[positionLevelName as keyof typeof positionCommissionRates];
      if (!rates) {
        console.log(`No commission rates defined for position level: ${positionLevelName}`);
        return { success: false, reason: "No commission rates defined for this position level" };
      }

      // Process each level separately
      for (const hierarchy of hierarchyLevels) {
        if (hierarchy.referrer.status !== "ACTIVE") continue;

        const commissionAmount = rates[hierarchy.level as keyof typeof rates];
        if (!commissionAmount) continue;

        // Determine transaction type based on level
        const transactionType =
          hierarchy.level === "A_LEVEL"
            ? "REFERRAL_REWARD_A"
            : hierarchy.level === "B_LEVEL"
              ? "REFERRAL_REWARD_B"
              : "REFERRAL_REWARD_C";

        // Award the commission
        await ReferralService.awardReferralInviteCommission(
          hierarchy.referrerId,
          userId,
          commissionAmount,
          transactionType,
          hierarchy.level,
          positionLevelName,
        );

        rewards.push({
          referrerId: hierarchy.referrerId,
          level: hierarchy.level,
          amount: commissionAmount,
          type: "position_upgrade" as const,
        });
      }

      // Mark referral activity as rewarded - only update activities that were created for this specific user
      const totalCommission = rewards.reduce((sum, reward) => sum + reward.amount, 0);
      await db.referralActivity.updateMany({
        where: {
          referredUserId: userId,
          status: "REGISTERED",
        },
        data: {
          status: "REWARDED",
          rewardAmount: totalCommission,
          rewardPaidAt: new Date(),
        },
      });

      return { success: true, rewards };
    } catch (error) {
      console.error("Error processing referral qualification:", error);
      return { success: false, reason: "Internal error occurred" };
    }
  }

  // Process referral task commission (when referred user completes daily tasks)
  static async processReferralTaskCommission(
    userId: string,
    taskEarning: number,
  ): Promise<{
    success: boolean;
    rewards?: Array<{
      referrerId: string;
      level: string;
      amount: number;
      type: "task";
    }>;
  }> {
    try {
      // Find user's referral hierarchy
      const hierarchyLevels = await db.referralHierarchy.findMany({
        where: { userId },
        include: {
          referrer: {
            select: { id: true, name: true, status: true },
          },
        },
        orderBy: { level: "asc" },
      });

      if (hierarchyLevels.length === 0) {
        return { success: false };
      }

      const rewards: Array<{
        referrerId: string;
        level: string;
        amount: number;
        type: "task";
      }> = [];

      // Award referral task commission to each level
      // Level A (direct referrer) → 8%
      // Level B (2nd level) → 3%
      // Level C (3rd level) → 1%
      const commissionRates = {
        A_LEVEL: 0.08, // 8%
        B_LEVEL: 0.03, // 3%
        C_LEVEL: 0.01, // 1%
      };

      for (const hierarchy of hierarchyLevels) {
        if (hierarchy.referrer.status !== "ACTIVE") continue;

        const commissionRate = commissionRates[hierarchy.level];
        if (!commissionRate) continue;

        const commissionAmount = taskEarning * commissionRate;

        // Determine transaction type based on level
        const transactionType =
          hierarchy.level === "A_LEVEL"
            ? "MANAGEMENT_BONUS_A"
            : hierarchy.level === "B_LEVEL"
              ? "MANAGEMENT_BONUS_B"
              : "MANAGEMENT_BONUS_C";

        // Award the commission
        await ReferralService.awardReferralTaskCommission(
          hierarchy.referrerId,
          userId,
          commissionAmount,
          transactionType,
          hierarchy.level,
          taskEarning,
        );

        rewards.push({
          referrerId: hierarchy.referrerId,
          level: hierarchy.level,
          amount: commissionAmount,
          type: "task" as const,
        });
      }

      return { success: true, rewards };
    } catch (error) {
      console.error("Error processing referral task commission:", error);
      return { success: false };
    }
  }

  // Build referral hierarchy for multi-level commissions
  static async buildReferralHierarchy(
    newUserId: string,
    directReferrerId: string,
  ): Promise<void> {
    try {
      // Level A - Direct referrer
      await db.referralHierarchy.create({
        data: {
          userId: newUserId,
          referrerId: directReferrerId,
          level: "A_LEVEL",
        },
      });

      // Find Level B - Direct referrer's referrer
      const levelBReferrer = await db.user.findUnique({
        where: { id: directReferrerId },
        select: { referredBy: true },
      });

      if (levelBReferrer?.referredBy) {
        await db.referralHierarchy.create({
          data: {
            userId: newUserId,
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
              userId: newUserId,
              referrerId: levelCReferrer.referredBy,
              level: "C_LEVEL",
            },
          });
        }
      }
    } catch (error) {
      console.error("Error building referral hierarchy:", error);
      throw error;
    }
  }

  // Award referral position upgrade commission
  private static async awardReferralInviteCommission(
    referrerId: string,
    referredUserId: string,
    commissionAmount: number,
    transactionType: string,
    level: string,
    positionLevelName: string,
  ): Promise<void> {
    try {
      // Get referred user info for transaction description
      const referredUser = await db.user.findUnique({
        where: { id: referredUserId },
        select: { name: true, email: true, phone: true },
      });

      // Use database transaction to ensure consistency
      await db.$transaction(async (tx) => {
        // Update referrer's commission balance (NOT main wallet)
        await tx.user.update({
          where: { id: referrerId },
          data: {
            commissionBalance: { increment: commissionAmount },
          },
        });

        // Get updated balance for transaction record
        const updatedReferrer = await tx.user.findUnique({
          where: { id: referrerId },
          select: { commissionBalance: true },
        });

        const levelName =
          level === "A_LEVEL"
            ? "Direct"
            : level === "B_LEVEL"
              ? "2nd Level"
              : "3rd Level";

        // Create transaction record
        await tx.walletTransaction.create({
          data: {
            userId: referrerId,
            type: transactionType as any,
            amount: commissionAmount,
            balanceAfter: updatedReferrer!.commissionBalance,
            description: `Position Upgrade Commission - ${levelName}: ${referredUser?.name || referredUser?.phone} upgraded to ${positionLevelName} (PKR ${commissionAmount})`,
            referenceId: `POSITION_UPGRADE_${level}_${referredUserId}_${Date.now()}`,
            status: "COMPLETED",
            metadata: JSON.stringify({
              referredUserId,
              level,
              positionLevelName,
              commissionAmount,
              type: "position_upgrade",
            }),
          },
        });
      });

      console.log(`Position upgrade commission awarded: ${referrerId} received PKR ${commissionAmount} from ${referredUserId}'s ${positionLevelName} upgrade`);
    } catch (error) {
      console.error("Error awarding referral position upgrade commission:", error);
      throw error;
    }
  }

  // Award referral task commission
  private static async awardReferralTaskCommission(
    referrerId: string,
    referredUserId: string,
    commissionAmount: number,
    transactionType: string,
    level: string,
    taskEarning: number,
  ): Promise<void> {
    try {
      // Get referred user info for transaction description
      const referredUser = await db.user.findUnique({
        where: { id: referredUserId },
        select: { name: true, email: true, phone: true },
      });

      // Update referrer's commission balance (NOT main wallet)
      await db.user.update({
        where: { id: referrerId },
        data: {
          commissionBalance: { increment: commissionAmount },
        },
      });

      // Get updated balance for transaction record
      const updatedReferrer = await db.user.findUnique({
        where: { id: referrerId },
        select: { commissionBalance: true },
      });

      const levelName =
        level === "A_LEVEL"
          ? "Direct (8%)"
          : level === "B_LEVEL"
            ? "2nd Level (3%)"
            : "3rd Level (1%)";

      // Create transaction record
      await db.walletTransaction.create({
        data: {
          userId: referrerId,
          type: transactionType as any,
          amount: commissionAmount,
          balanceAfter: updatedReferrer!.commissionBalance,
          description: `Referral Task Commission - ${levelName}: ${referredUser?.name || referredUser?.phone} completed task (PKR ${taskEarning})`,
          referenceId: `REFERRAL_TASK_${level}_${referredUserId}_${Date.now()}`,
          status: "COMPLETED",
          metadata: JSON.stringify({
            referredUserId,
            level,
            taskEarning,
            commissionRate:
              level === "A_LEVEL" ? "8%" : level === "B_LEVEL" ? "3%" : "1%",
          }),
        },
      });
    } catch (error) {
      console.error("Error awarding referral task commission:", error);
      throw error;
    }
  }

  // Generate referral link
  static generateReferralLink(referralCode: string, baseUrl?: string): string {
    const url =
      baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://icl.finance";
    return `${url}/register?ref=${referralCode}`;
  }

  // Generate social sharing links
  static generateSocialLinks(
    referralCode: string,
    baseUrl?: string,
  ): Record<string, string> {
    const referralLink = this.generateReferralLink(referralCode, baseUrl);
    const message = encodeURIComponent(
      `Join me on VideoTask and start earning money by watching videos! Use my referral link: ${referralLink}`,
    );

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${message}`,
      whatsapp: `https://wa.me/?text=${message}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on VideoTask and start earning!")}`,
      email: `mailto:?subject=${encodeURIComponent("Join VideoTask and Earn Money!")}&body=${message}`,
      copy: referralLink,
    };
  }

  // Get referral statistics
  static async getReferralStats(userId: string): Promise<any> {
    try {
      const [activities, inviteRewards, taskRewards, hierarchyStats] =
        await Promise.all([
          // Get all referral activities
          db.referralActivity
            .findMany({
              where: { referrerId: userId },
              orderBy: { createdAt: "desc" },
            })
            .catch(() => []),

          // Get referral invite commission rewards
          db.walletTransaction
            .aggregate({
              where: {
                userId,
                type: {
                  in: [
                    "REFERRAL_REWARD_A",
                    "REFERRAL_REWARD_B",
                    "REFERRAL_REWARD_C",
                  ],
                },
                status: "COMPLETED",
              },
              _sum: { amount: true },
              _count: true,
            })
            .catch(() => ({ _sum: { amount: 0 }, _count: 0 })),

          // Get referral task commission rewards
          db.walletTransaction
            .aggregate({
              where: {
                userId,
                type: {
                  in: [
                    "MANAGEMENT_BONUS_A",
                    "MANAGEMENT_BONUS_B",
                    "MANAGEMENT_BONUS_C",
                  ],
                },
                status: "COMPLETED",
              },
              _sum: { amount: true },
              _count: true,
            })
            .catch(() => ({ _sum: { amount: 0 }, _count: 0 })),

          // Get hierarchy statistics
          db.referralHierarchy
            .groupBy({
              by: ["level"],
              where: { referrerId: userId },
              _count: true,
            })
            .catch(() => []),
        ]);

      return {
        totalReferrals: activities?.length || 0,
        registeredReferrals:
          activities?.filter((a) =>
            ["REGISTERED", "QUALIFIED", "REWARDED"].includes(a.status),
          ).length || 0,
        qualifiedReferrals:
          activities?.filter((a) =>
            ["QUALIFIED", "REWARDED"].includes(a.status),
          ).length || 0,

        // Multi-level breakdown
        levelA: hierarchyStats?.find((h) => h.level === "A_LEVEL")?._count || 0,
        levelB: hierarchyStats?.find((h) => h.level === "B_LEVEL")?._count || 0,
        levelC: hierarchyStats?.find((h) => h.level === "C_LEVEL")?._count || 0,

        // Commission earnings
        inviteCommissionTotal: inviteRewards?._sum?.amount || 0,
        inviteCommissionCount: inviteRewards?._count || 0,
        taskCommissionTotal: taskRewards?._sum?.amount || 0,
        taskCommissionCount: taskRewards?._count || 0,
        totalCommissionEarnings:
          (inviteRewards?._sum?.amount || 0) + (taskRewards?._sum?.amount || 0),

        activities:
          activities?.map((activity) => ({
            id: activity.id,
            status: activity.status,
            source: activity.source || "unknown",
            createdAt: activity.createdAt.toISOString(),
          })) || [],
      };
    } catch (error) {
      console.error("Error getting referral stats:", error);
      return {
        totalReferrals: 0,
        registeredReferrals: 0,
        qualifiedReferrals: 0,
        levelA: 0,
        levelB: 0,
        levelC: 0,
        inviteCommissionTotal: 0,
        inviteCommissionCount: 0,
        taskCommissionTotal: 0,
        taskCommissionCount: 0,
        totalCommissionEarnings: 0,
        activities: [],
      };
    }
  }
}
