import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { ReferralService } from "@/lib/referral-service";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authMiddleware(request);
    if (!user || !user.id) {
      const response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get enhanced referral statistics
    const enhancedStats = await ReferralService.getReferralStats(user.id);

    // Get legacy referral data for backward compatibility
    const referrals = await db.user.findMany({
      where: { referredBy: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        totalEarnings: true,
        walletBalance: true,
        referralHierarchy: {
          where: { referrerId: user.id },
          select: { level: true },
        },
      },
    });

    // Calculate legacy stats
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter((r) => r.totalEarnings > 0 || r.walletBalance > 0).length;

    // Get top performers
    const topReferrals = referrals
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        name: r.name || r.email,
        earnings: r.totalEarnings,
        joinedAt: r.createdAt.toISOString(),
      }));

    // Get commission earnings only (one-time position upgrade commissions)
    const commissionEarnings = await db.walletTransaction.aggregate({
      where: {
        userId: user.id,
        type: {
          in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
        },
        status: "COMPLETED",
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get task bonus earnings separately (daily recurring bonuses)
    const taskBonusEarnings = await db.walletTransaction.aggregate({
      where: {
        userId: user.id,
        type: {
          in: ["MANAGEMENT_BONUS_A", "MANAGEMENT_BONUS_B", "MANAGEMENT_BONUS_C"],
        },
        status: "COMPLETED",
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get comprehensive earnings (commission + bonus) for backward compatibility
    const allEarnings = await db.walletTransaction.aggregate({
      where: {
        userId: user.id,
        type: {
          in: [
            "REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C",
            "MANAGEMENT_BONUS_A", "MANAGEMENT_BONUS_B", "MANAGEMENT_BONUS_C"
          ],
        },
        status: "COMPLETED",
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get level-specific breakdown
    const levelBreakdown = await db.walletTransaction.groupBy({
      by: ['type'],
      where: {
        userId: user.id,
        type: {
          in: [
            "REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C",
            "MANAGEMENT_BONUS_A", "MANAGEMENT_BONUS_B", "MANAGEMENT_BONUS_C"
          ],
        },
        status: "COMPLETED",
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get detailed commission breakdown with referred user info
    const commissionTransactions = await db.walletTransaction.findMany({
      where: {
        userId: user.id,
        type: {
          in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
        },
        status: "COMPLETED",
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get detailed bonus breakdown with referred user info
    const bonusTransactions = await db.walletTransaction.findMany({
      where: {
        userId: user.id,
        type: {
          in: ["MANAGEMENT_BONUS_A", "MANAGEMENT_BONUS_B", "MANAGEMENT_BONUS_C"],
        },
        status: "COMPLETED",
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${bonusTransactions.length} bonus transactions for user ${user.id}`);

    // Build commission breakdown with real data
    const commissionBreakdown: Array<{
      referredUserId: string;
      referredUserName: string;
      referredUserEmail: string | null;
      positionLevel: string;
      commissionAmount: number;
      level: string;
      earnedAt: string;
    }> = [];

    for (const transaction of commissionTransactions) {
      if (transaction.metadata) {
        try {
          const metadata = JSON.parse(transaction.metadata);
          console.log("Processing commission transaction metadata:", metadata);

          if (metadata.referredUserId) {
            // Get the referred user details
            const referredUser = await db.user.findUnique({
              where: { id: metadata.referredUserId },
              select: {
                id: true,
                name: true,
                email: true,
                currentPositionId: true,
              },
            });

            if (referredUser) {
              console.log(`Found referred user: ${referredUser.name} (${referredUser.id})`);

              // Get the position level name
              let positionLevel = "L1";
              if (referredUser.currentPositionId) {
                const position = await db.positionLevel.findUnique({
                  where: { id: referredUser.currentPositionId },
                  select: { name: true },
                });
                if (position) {
                  positionLevel = position.name;
                }
              }

              commissionBreakdown.push({
                referredUserId: referredUser.id,
                referredUserName: referredUser.name || "Unknown User",
                referredUserEmail: referredUser.email,
                positionLevel: positionLevel,
                commissionAmount: transaction.amount,
                level: metadata.level || transaction.type.replace("REFERRAL_REWARD_", ""),
                earnedAt: transaction.createdAt.toISOString(),
              });
            } else {
              console.log(`Referred user not found: ${metadata.referredUserId}`);
            }
          } else {
            console.log("No referredUserId found in metadata:", metadata);
          }
        } catch (error) {
          console.error("Error parsing commission transaction metadata:", error, transaction.metadata);
        }
      } else {
        console.log("No metadata found in commission transaction:", transaction.id);
      }
    }

    console.log(`Built commission breakdown with ${commissionBreakdown.length} entries`);

    // Build bonus breakdown with real data
    const bonusBreakdown: Array<{
      referredUserId: string;
      referredUserName: string;
      referredUserEmail: string | null;
      taskEarning: number;
      bonusAmount: number;
      level: string;
      earnedAt: string;
    }> = [];

    for (const transaction of bonusTransactions) {
      if (transaction.metadata) {
        try {
          const metadata = JSON.parse(transaction.metadata);
          console.log("Processing bonus transaction metadata:", metadata);

          // For bonus transactions, the referred user is stored as subordinateId
          if (metadata.subordinateId) {
            // Get the referred user details
            const referredUser = await db.user.findUnique({
              where: { id: metadata.subordinateId },
              select: {
                id: true,
                name: true,
                email: true,
              },
            });

            if (referredUser) {
              console.log(`Found referred user: ${referredUser.name} (${referredUser.id})`);
              bonusBreakdown.push({
                referredUserId: referredUser.id,
                referredUserName: referredUser.name || "Unknown User",
                referredUserEmail: referredUser.email,
                taskEarning: metadata.taskIncome || 0,
                bonusAmount: transaction.amount,
                level: metadata.level || transaction.type.replace("MANAGEMENT_BONUS_", ""),
                earnedAt: transaction.createdAt.toISOString(),
              });
            } else {
              console.log(`Referred user not found: ${metadata.subordinateId}`);
            }
          } else {
            console.log("No subordinateId found in metadata:", metadata);
          }
        } catch (error) {
          console.error("Error parsing bonus transaction metadata:", error, transaction.metadata);
        }
      } else {
        console.log("No metadata found in bonus transaction:", transaction.id);
      }
    }

    console.log(`Built bonus breakdown with ${bonusBreakdown.length} entries`);

    // Get user's current commission balance
    const userWithBalance = await db.user.findUnique({
      where: { id: user.id },
      select: { commissionBalance: true },
    });

    // Generate referral links
    const socialLinks = ReferralService.generateSocialLinks(
      user.referralCode || "",
    );

    // Combine enhanced stats with legacy stats for complete data
    const combinedStats = enhancedStats || {
      totalReferrals: 0,
      registeredReferrals: 0,
      qualifiedReferrals: 0,
      rewardedReferrals: 0,
      totalEarnings: 0,
      monthlyReferrals: 0,
      activities: [],
    };

    // Calculate level-specific earnings from commission breakdown only (for Commission Earnings section)
    const levelEarnings = {
      A_LEVEL: 0,
      B_LEVEL: 0,
      C_LEVEL: 0,
    };

    console.log("Calculating level earnings from commission breakdown...");

    // Calculate from commission breakdown data only
    commissionBreakdown.forEach((commission) => {
      console.log(`Processing commission: ${commission.referredUserName} - Level: ${commission.level} - Amount: ${commission.commissionAmount}`);

      if (commission.level === "A_LEVEL") {
        levelEarnings.A_LEVEL += commission.commissionAmount;
      } else if (commission.level === "B_LEVEL") {
        levelEarnings.B_LEVEL += commission.commissionAmount;
      } else if (commission.level === "C_LEVEL") {
        levelEarnings.C_LEVEL += commission.commissionAmount;
      }
    });

    console.log("Final level earnings:", levelEarnings);

    const response = NextResponse.json({
      success: true,
      referralCode: user.referralCode,
      referralLink: ReferralService.generateReferralLink(
        user.referralCode || "",
      ),
      socialLinks,

      // Main stats object that the component expects
      stats: {
        totalReferrals: Math.max(combinedStats.totalReferrals, totalReferrals),
        registeredReferrals: combinedStats.registeredReferrals,
        qualifiedReferrals: combinedStats.qualifiedReferrals,
        rewardedReferrals: combinedStats.rewardedReferrals,
        totalEarnings: combinedStats.totalEarnings,
        monthlyReferrals: combinedStats.monthlyReferrals,
        activities: combinedStats.activities || [],
      },

      // Enhanced commission and bonus data
      commissionBalance: userWithBalance?.commissionBalance || 0,
      totalCommissionEarnings: allEarnings._sum.amount || 0, // Total of all earnings (commission + bonus)
      totalCommissionCount: allEarnings._count || 0,
      taskBonusEarnings: taskBonusEarnings._sum.amount || 0,
      taskBonusCount: taskBonusEarnings._count || 0,

      // Level-specific earnings breakdown (includes both commission and bonus)
      levelEarnings: {
        A_LEVEL: levelEarnings.A_LEVEL,
        B_LEVEL: levelEarnings.B_LEVEL,
        C_LEVEL: levelEarnings.C_LEVEL,
      },

      // Detailed breakdown data
      commissionBreakdown,
      bonusBreakdown,

      // Legacy stats for backward compatibility
      totalReferrals,
      activeReferrals,
      totalReferralEarnings: allEarnings._sum.amount || 0, // Use actual earnings instead of fallback calculation
      referralCommissionEarnings: commissionEarnings._sum.amount || 0, // Only commission earnings (position upgrades)
      bonusEarnings: taskBonusEarnings._sum.amount || 0, // Only task bonus earnings (daily recurring)
      monthlyReferrals: combinedStats.monthlyReferrals || 0,
      topReferrals,
      referrals: referrals.map((r) => {
        // Calculate earnings from commission and bonus breakdowns
        const userCommissions = commissionBreakdown.filter(c => c.referredUserId === r.id);
        const userBonuses = bonusBreakdown.filter(b => b.referredUserId === r.id);

        const totalCommissionEarned = userCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const totalBonusEarned = userBonuses.reduce((sum, b) => sum + b.bonusAmount, 0);

        return {
          id: r.id,
          name: r.name || r.email,
          email: r.email,
          level: r.referralHierarchy?.[0]?.level?.replace("_LEVEL", "") || "",
          earnings: r.totalEarnings,
          balance: r.walletBalance,
          joinedAt: r.createdAt.toISOString(),
          isActive: r.totalEarnings > 0 || r.walletBalance > 0,
          totalCommissionEarned,
          totalBonusEarned,
        };
      }),
    }) as NextResponse;

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Get referral stats error:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
