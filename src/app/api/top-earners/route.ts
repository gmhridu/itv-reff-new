import { NextRequest, NextResponse } from "next/server";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const period = url.searchParams.get("period") || "weekly"; // weekly, monthly, all-time

    // Calculate date range based on period
    let dateFilter = {};
    const now = new Date();

    if (period === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { gte: weekAgo };
    } else if (period === "monthly") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { gte: monthAgo };
    }

    // Get top earners based on total earnings
    const topEarners = await db.user.findMany({
      where: {
        totalEarnings: { gt: 0 },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        totalEarnings: true,
        currentPosition: {
          select: {
            name: true,
            level: true,
          },
        },
      },
      orderBy: {
        totalEarnings: "desc",
      },
      take: limit,
    });

    // Get period-specific transactions separately if needed
    let periodTransactions: { [userId: string]: { amount: number }[] } = {};
    if (period !== "all-time" && Object.keys(dateFilter).length > 0) {
      const transactions = await db.walletTransaction.findMany({
        where: {
          userId: { in: topEarners.map((user) => user.id) },
          createdAt: dateFilter,
          amount: { gt: 0 },
        },
        select: {
          userId: true,
          amount: true,
        },
      });

      // Group by userId
      periodTransactions = transactions.reduce(
        (acc, tx) => {
          if (!acc[tx.userId]) acc[tx.userId] = [];
          acc[tx.userId].push({ amount: tx.amount });
          return acc;
        },
        {} as { [userId: string]: { amount: number }[] },
      );
    }

    // Format the data with masked details and calculate period earnings
    const formattedEarners = topEarners.map((user, index) => {
      // Calculate period-specific earnings
      let periodEarnings = user.totalEarnings;
      if (period !== "all-time" && periodTransactions[user.id]) {
        periodEarnings = periodTransactions[user.id].reduce(
          (sum, tx) => sum + tx.amount,
          0,
        );
      }

      // Mask user details for privacy
      const displayName = user.name || user.email || "Unknown";
      const nameLength = displayName.length;
      const maskedName =
        nameLength > 3
          ? displayName.substring(0, 2) +
            "*".repeat(Math.max(3, nameLength - 4)) +
            displayName.slice(-2)
          : "*".repeat(nameLength);

      const email = user.email || "unknown@example.com";
      const emailParts = email.split("@");
      const maskedEmail =
        emailParts.length === 2 && emailParts[0].length > 2
          ? emailParts[0].substring(0, 2) +
            "*".repeat(Math.max(3, emailParts[0].length - 4)) +
            emailParts[0].slice(-2) +
            "@" +
            emailParts[1]
          : "***@example.com";

      return {
        id: `masked_${index + 1}`,
        name: maskedName,
        email: maskedEmail,
        position: user.currentPosition?.name || "Intern",
        level: user.currentPosition?.level || 1,
        earnings: periodEarnings,
        rank: index + 1,
        // Show total earnings for motivation but keep details private
        displayEarnings: `PKR ${periodEarnings.toFixed(2)}`,
        subtitle: `${user.currentPosition?.name || "Intern"} • Level ${user.currentPosition?.level || 1}`,
      };
    });

    // Add some statistical data for context
    const totalActiveUsers = await db.user.count({
      where: {
        status: "ACTIVE",
        totalEarnings: { gt: 0 },
      },
    });

    const averageEarnings =
      topEarners.length > 0
        ? topEarners.reduce((sum, user) => {
            if (period !== "all-time" && periodTransactions[user.id]) {
              return (
                sum +
                periodTransactions[user.id].reduce(
                  (txSum, tx) => txSum + tx.amount,
                  0,
                )
              );
            }
            return sum + user.totalEarnings;
          }, 0) / topEarners.length
        : 0;

    response = NextResponse.json({
      success: true,
      data: {
        topEarners: formattedEarners,
        period,
        totalActiveUsers,
        averageEarnings,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Top earners API error:", error);
    response = NextResponse.json(
      { success: false, error: "Failed to fetch top earners" },
      { status: 500 },
    );
  }

  return addAPISecurityHeaders(response);
}
