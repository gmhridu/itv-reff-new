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
    const activeReferrals = referrals.filter((r) => r.totalEarnings > 0).length;

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

    // Get commission earnings from referral rewards (subscription bonuses)
    const commissionEarnings = await db.walletTransaction.aggregate({
      where: {
        userId: user.id,
        type: {
          in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
        },
      },
      _sum: { amount: true },
    });

    // Get bonus earnings from task management bonuses
    const bonusEarnings = await db.taskManagementBonus.aggregate({
      where: {
        userId: user.id,
      },
      _sum: { bonusAmount: true },
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

      // Legacy stats for backward compatibility
      totalReferrals,
      activeReferrals,
      totalReferralEarnings:
        combinedStats.totalEarnings || totalReferrals * 5.0,
      referralCommissionEarnings: commissionEarnings._sum.amount || 0,
      bonusEarnings: bonusEarnings._sum.bonusAmount || 0,
      monthlyReferrals: combinedStats.monthlyReferrals || 0,
      topReferrals,
      referrals: referrals.map((r) => ({
        id: r.id,
        name: r.name || r.email,
        email: r.email,
        level: r.referralHierarchy?.[0]?.level?.replace("_LEVEL", "") || "",
        earnings: r.totalEarnings,
        balance: r.walletBalance,
        joinedAt: r.createdAt.toISOString(),
        isActive: r.totalEarnings > 0,
      })),
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
