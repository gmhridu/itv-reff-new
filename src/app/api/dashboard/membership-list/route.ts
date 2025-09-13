import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authMiddleware } from "@/lib/api/api-auth";

interface MembershipListItem {
  id: string;
  name: string;
  subtitle?: string;
  amount: string;
  periodEarnings: number;
  totalEarnings: number;
  avatar: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type") || "weekly"; // weekly, daily, monthly

    // Calculate date range based on type
    const now = new Date();
    let startDate: Date;

    switch (type) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "weekly":
      default:
        // Last 7 days
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get top earners for the specified period
    const topEarners = await db.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        totalEarnings: true,
        transactions: {
          where: {
            createdAt: {
              gte: startDate,
            },
            type: {
              in: [
                "CREDIT",
                "TASK_INCOME",
                "REFERRAL_REWARD_A",
                "REFERRAL_REWARD_B",
                "REFERRAL_REWARD_C",
              ],
            },
            status: "COMPLETED",
          },
          select: {
            amount: true,
            createdAt: true,
            type: true,
          },
        },
      },
      orderBy: {
        totalEarnings: "desc",
      },
      take: limit * 2, // Get more to filter properly
    });

    // Calculate earnings for the period and format data
    const membershipList: any[] = topEarners
      .map((user) => {
        const periodEarnings = user.transactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0,
        );

        // Only include users with earnings in the period
        if (periodEarnings <= 0) return null;

        // Mask phone number for privacy (show last 4 digits)
        const maskedPhone = user.phone
          ? `***${user.phone.slice(-4)}`
          : `***${Math.floor(1000 + Math.random() * 9000)}`;

        const subtitle =
          type === "daily"
            ? "Today's earnings"
            : type === "monthly"
              ? "This month's earnings"
              : "Last week's earnings";

        return {
          id: user.id,
          name: `Congratulations ${maskedPhone}`,
          subtitle: subtitle,
          amount: `${Math.round(periodEarnings)}PKR`,
          periodEarnings,
          totalEarnings: user.totalEarnings,
          avatar: `/avatar${(parseInt(user.id.slice(-1), 36) % 5) + 1}.jpg`, // Generate avatar based on ID
        } as MembershipListItem;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.periodEarnings - a.periodEarnings)
      .slice(0, limit);

    // Add a featured top earner entry at the beginning if we have data
    if (membershipList.length > 0) {
      const topEarner = membershipList[0];
      const featuredName =
        type === "daily"
          ? "Today's top earner"
          : type === "monthly"
            ? "This month's top earner"
            : "Last week's top earner";

      membershipList.unshift({
        id: "featured",
        name: featuredName,
        amount: topEarner.amount,
        periodEarnings: topEarner.periodEarnings,
        totalEarnings: topEarner.totalEarnings,
        avatar: topEarner.avatar,
      });
    }

    // If no real data, return some example data to show the feature works
    if (membershipList.length === 0) {
      const periodText =
        type === "daily"
          ? "Today's earnings"
          : type === "monthly"
            ? "This month's earnings"
            : "Last week's earnings";

      const exampleData: any[] = [
        {
          id: "example1",
          name: periodText,
          amount: "0PKR",
          periodEarnings: 0,
          totalEarnings: 0,
          avatar: "/avatar1.jpg",
        },
        {
          id: "example2",
          name: "Congratulations ***1794",
          subtitle: periodText,
          amount: "0PKR",
          periodEarnings: 0,
          totalEarnings: 0,
          avatar: "/avatar2.jpg",
        },
      ];

      return NextResponse.json({
        success: true,
        data: {
          membershipList: exampleData,
          period: type,
          startDate: startDate.toISOString(),
          total: exampleData.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        membershipList,
        period: type,
        startDate: startDate.toISOString(),
        total: membershipList.length,
      },
    });
  } catch (error) {
    console.error("Error fetching membership list:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
