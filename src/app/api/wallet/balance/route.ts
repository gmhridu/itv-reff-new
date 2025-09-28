import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db } from "@/lib/db";

// --- Constants ---
const EARNING_TYPES = [
  "TASK_INCOME",
  "REFERRAL_REWARD_A",
  "REFERRAL_REWARD_B",
  "REFERRAL_REWARD_C",
  "MANAGEMENT_BONUS_A",
  "MANAGEMENT_BONUS_B",
  "MANAGEMENT_BONUS_C",
  "TOPUP_BONUS",
  "SPECIAL_COMMISSION",
] as const;

const PERIODS = [
  "today",
  "yesterday",
  "thisWeek",
  "thisMonth",
  "allTime",
] as const;
type Period = (typeof PERIODS)[number];

// --- Helpers ---
const sumAmount = (res: { _sum: { amount: number | null } }) =>
  res._sum.amount || 0;

async function aggregateEarnings(
  userId: string,
  types: readonly string[] = EARNING_TYPES,
  dateFilter: any = {}
) {
  return db.walletTransaction.aggregate({
    where: {
      userId,
      type: { in: types as any },
      status: "COMPLETED",
      ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    },
    _sum: { amount: true },
  });
}

function getDateRanges() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfDay);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(startOfDay);
  startOfMonth.setDate(1);

  return { now, startOfDay, startOfYesterday, startOfWeek, startOfMonth };
}

async function getEarningsTrend(userId: string, amount: number) {
  try {
    const { now } = getDateRanges();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const prev = await aggregateEarnings(userId, EARNING_TYPES, {
      gte: yesterday,
      lt: now,
    });
    const previousAmount = sumAmount(prev);

    if (amount > previousAmount) return "up";
    if (amount < previousAmount) return "down";
    return "neutral";
  } catch (err) {
    console.error("Trend error:", err);
    return "neutral";
  }
}

// --- API Route ---
export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);
    if (!user)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );

    const freshUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        walletBalance: true,
        commissionBalance: true,
        depositPaid: true,
        securityRefund: true,
      },
    });

    if (!freshUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // --- Earnings breakdown ---
    const [
      totalAgg,
      dailyTask,
      referralInvite,
      referralTask,
      topupBonus,
      specialCommission,
    ] = await Promise.all([
      aggregateEarnings(user.id),
      aggregateEarnings(user.id, ["TASK_INCOME"]),
      aggregateEarnings(user.id, [
        "REFERRAL_REWARD_A",
        "REFERRAL_REWARD_B",
        "REFERRAL_REWARD_C",
      ]),
      aggregateEarnings(user.id, [
        "MANAGEMENT_BONUS_A",
        "MANAGEMENT_BONUS_B",
        "MANAGEMENT_BONUS_C",
      ]),
      aggregateEarnings(user.id, ["TOPUP_BONUS"]),
      aggregateEarnings(user.id, ["SPECIAL_COMMISSION"]),
    ]);

    const actualTotalEarnings = sumAmount(totalAgg);
    const userSecurityRefund = freshUser.securityRefund || 0;

    // --- Period earnings ---
    const { startOfDay, startOfYesterday, startOfWeek, startOfMonth } =
      getDateRanges();

    const [today, yesterday, thisWeek, thisMonth] = await Promise.all([
      aggregateEarnings(user.id, EARNING_TYPES, { gte: startOfDay }),
      aggregateEarnings(user.id, EARNING_TYPES, {
        gte: startOfYesterday,
        lt: startOfDay,
      }),
      aggregateEarnings(user.id, EARNING_TYPES, { gte: startOfWeek }),
      aggregateEarnings(user.id, EARNING_TYPES, { gte: startOfMonth }),
    ]);

    const amounts = {
      today: sumAmount(today),
      yesterday: sumAmount(yesterday),
      thisWeek: sumAmount(thisWeek),
      thisMonth: sumAmount(thisMonth),
      allTime: actualTotalEarnings,
    };

    const trends = await Promise.all(
      (Object.entries(amounts) as [Period, number][]).map(([period, amt]) =>
        getEarningsTrend(user.id, amt)
      )
    );

    // --- Response ---
    return NextResponse.json({
      userName: freshUser.name || "",
      userPhone: freshUser.phone || "",
      currentBalance: freshUser.walletBalance || 0,
      securityDeposited: freshUser.depositPaid || 0,
      commissionBalance: actualTotalEarnings,
      securityRefund: userSecurityRefund,
      totalEarnings: actualTotalEarnings,
      totalAvailableForWithdrawal: actualTotalEarnings + userSecurityRefund,
      earningsBreakdown: {
        dailyTaskCommission: sumAmount(dailyTask),
        referralInviteCommission: sumAmount(referralInvite),
        referralTaskCommission: sumAmount(referralTask),
        usdtTopupBonus: sumAmount(topupBonus),
        specialCommission: sumAmount(specialCommission),
      },
      recentEarnings: Object.fromEntries(
        (Object.entries(amounts) as [Period, number][]).map(
          ([period, amount], i) => [period, { amount, trend: trends[i] }]
        )
      ),
    });
  } catch (error) {
    console.error("Get wallet balance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
