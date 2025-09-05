import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get referral reward transactions
    const referralTransactions = await db.walletTransaction.findMany({
      where: {
        userId: user.id,
        type: {
          in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get total counts and amounts by tier
    const rewardSummary = await db.walletTransaction.groupBy({
      by: ["type"],
      where: {
        userId: user.id,
        type: {
          in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    const summaryMap = rewardSummary.reduce((acc, item) => {
      const tier = item.type.replace("REFERRAL_REWARD_", "").toLowerCase();
      acc[tier] = {
        count: item._count,
        totalAmount: item._sum.amount || 0,
      };
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);

    // Format transaction details
    const rewardHistory = referralTransactions.map((transaction) => {
      const metadata = transaction.metadata
        ? JSON.parse(transaction.metadata)
        : {};
      const tier = transaction.type
        .replace("REFERRAL_REWARD_", "")
        .toLowerCase();

      return {
        id: transaction.id,
        tier,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt,
        referredUserPosition: metadata.newUserPosition || "Unknown",
        referrerPosition: metadata.referrerPosition || "Unknown",
      };
    });

    // Calculate totals
    const totalRewards = {
      aLevel: summaryMap.a?.totalAmount || 0,
      bLevel: summaryMap.b?.totalAmount || 0,
      cLevel: summaryMap.c?.totalAmount || 0,
      total: 0,
    };

    const totalCounts = {
      aLevel: summaryMap.a?.count || 0,
      bLevel: summaryMap.b?.count || 0,
      cLevel: summaryMap.c?.count || 0,
      total: 0,
    };

    totalRewards.total =
      totalRewards.aLevel + totalRewards.bLevel + totalRewards.cLevel;
    totalCounts.total =
      totalCounts.aLevel + totalCounts.bLevel + totalCounts.cLevel;

    // Get management bonuses
    const managementBonuses = await db.taskManagementBonus.findMany({
      where: {
        userId: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        subordinate: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Calculate management bonus summary
    const managementSummary = await db.taskManagementBonus.groupBy({
      by: ["subordinateLevel"],
      where: {
        userId: user.id,
      },
      _sum: { bonusAmount: true },
      _count: true,
    });

    const managementMap = managementSummary.reduce((acc, item) => {
      const level = item.subordinateLevel.toLowerCase();
      acc[level] = {
        count: item._count,
        totalAmount: item._sum.bonusAmount || 0,
      };
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);

    const totalManagementBonuses = {
      aLevel: managementMap.a_level?.totalAmount || 0,
      bLevel: managementMap.b_level?.totalAmount || 0,
      cLevel: managementMap.c_level?.totalAmount || 0,
      total: 0,
    };
    totalManagementBonuses.total =
      totalManagementBonuses.aLevel +
      totalManagementBonuses.bLevel +
      totalManagementBonuses.cLevel;

    // Calculate monthly breakdown
    const currentDate = new Date();
    const monthlyBreakdown: Array<{
      month: string;
      referralRewards: number;
      managementBonuses: number;
      total: number;
    }> = [];

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i + 1,
        0
      );

      const monthlyReferralRewards = await db.walletTransaction.aggregate({
        where: {
          userId: user.id,
          type: {
            in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
          },
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: { amount: true },
      });

      const monthlyManagementBonuses = await db.taskManagementBonus.aggregate({
        where: {
          userId: user.id,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: { bonusAmount: true },
      });

      monthlyBreakdown.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        referralRewards: monthlyReferralRewards._sum.amount || 0,
        managementBonuses: monthlyManagementBonuses._sum.bonusAmount || 0,
        total:
          (monthlyReferralRewards._sum.amount || 0) +
          (monthlyManagementBonuses._sum.bonusAmount || 0),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        rewardHistory,
        managementBonuses: managementBonuses.map((bonus) => ({
          id: bonus.id,
          amount: bonus.bonusAmount,
          level: bonus.subordinateLevel,
          taskIncome: bonus.taskIncome,
          subordinate: bonus.subordinate?.name || "Unknown",
          createdAt: bonus.createdAt,
        })),
        totalRewards,
        totalCounts,
        totalManagementBonuses,
        monthlyBreakdown: monthlyBreakdown.reverse(),
        pagination: {
          limit,
          offset,
          hasMore: referralTransactions.length === limit,
        },
      },
    });
  } catch (error) {
    console.error("Get referral rewards error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
