"use client";

import { useState, useEffect } from "react";
import { DashboardData } from "./use-dashboard";

export interface UserAnalyticsData {
  incomeTracking: {
    daily: Array<{
      date: string;
      earnings: number;
      videosWatched: number;
    }>;
    weekly: Array<{
      week: string;
      earnings: number;
      videosWatched: number;
    }>;
    monthly: Array<{
      month: string;
      earnings: number;
      videosWatched: number;
    }>;
  };
  userGrowth: {
    referralStats: {
      totalReferrals: number;
      activeReferrals: number;
      referralEarnings: number;
      monthlyGrowth: Array<{
        month: string;
        newReferrals: number;
        totalReferrals: number;
      }>;
    };
    progressStats: {
      currentLevel: string;
      nextLevel: string;
      progressToNext: number;
      daysActive: number;
    };
  };
  revenueBreakdown: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  performanceMetrics: {
    averageEarningsPerVideo: number;
    completionRate: number;
    streakDays: number;
    totalVideoHours: number;
  };
}

interface UseUserAnalyticsParams {
  timePeriod?: "daily" | "weekly" | "monthly";
  dashboardData?: DashboardData;
}

interface UseUserAnalyticsReturn {
  data: UserAnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserAnalytics({
  timePeriod = "monthly",
  dashboardData,
}: UseUserAnalyticsParams = {}): UseUserAnalyticsReturn {
  const [data, setData] = useState<UserAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMockData = (
    dashboardData?: DashboardData,
  ): UserAnalyticsData => {
    const currentDate = new Date();
    const userEarnings = dashboardData?.user.totalEarnings || 0;
    const walletBalance = dashboardData?.user.walletBalance || 0;
    const todayEarnings = dashboardData?.todayProgress.earningsToday || 0;

    // Generate income tracking data
    const monthlyIncomeData = Array.from({ length: 9 }, (_, index) => {
      const month = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 8 + index,
      );
      const baseEarnings = Math.random() * 500 + 200;
      const seasonalMultiplier = Math.sin((index * Math.PI) / 4) * 0.3 + 1;
      const earnings = Math.round(baseEarnings * seasonalMultiplier);

      return {
        month: month.toLocaleDateString("en-US", { month: "short" }),
        earnings,
        videosWatched: Math.round(earnings / 5), // Assuming $5 per video average
      };
    });

    const weeklyIncomeData = Array.from({ length: 12 }, (_, index) => {
      const weekStart = new Date(
        currentDate.getTime() - (11 - index) * 7 * 24 * 60 * 60 * 1000,
      );
      const baseEarnings = Math.random() * 150 + 50;
      const earnings = Math.round(baseEarnings);

      return {
        week: `Week ${index + 1}`,
        earnings,
        videosWatched: Math.round(earnings / 5),
      };
    });

    const dailyIncomeData = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(
        currentDate.getTime() - (29 - index) * 24 * 60 * 60 * 1000,
      );
      const baseEarnings = Math.random() * 30 + 5;
      const earnings = index === 29 ? todayEarnings : Math.round(baseEarnings);

      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        earnings,
        videosWatched: Math.round(earnings / 5),
      };
    });

    // Generate referral growth data
    const monthlyReferralGrowth = Array.from({ length: 6 }, (_, index) => {
      const month = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 5 + index,
      );
      const newReferrals = Math.floor(Math.random() * 15) + 2;
      const totalReferrals =
        (dashboardData?.referralStats?.totalReferrals || 0) + index * 3;

      return {
        month: month.toLocaleDateString("en-US", { month: "short" }),
        newReferrals,
        totalReferrals: Math.max(totalReferrals, newReferrals),
      };
    });

    // Generate revenue breakdown
    const totalRevenue = userEarnings + walletBalance;
    const revenueBreakdown = [
      {
        source: "Video Tasks",
        amount: Math.round(totalRevenue * 0.65),
        percentage: 65,
      },
      {
        source: "Referral Bonuses",
        amount: Math.round(totalRevenue * 0.2),
        percentage: 20,
      },
      {
        source: "Level Bonuses",
        amount: Math.round(totalRevenue * 0.1),
        percentage: 10,
      },
      {
        source: "Special Tasks",
        amount: Math.round(totalRevenue * 0.05),
        percentage: 5,
      },
    ];

    return {
      incomeTracking: {
        daily: dailyIncomeData,
        weekly: weeklyIncomeData,
        monthly: monthlyIncomeData,
      },
      userGrowth: {
        referralStats: {
          totalReferrals: dashboardData?.referralStats?.totalReferrals || 12,
          activeReferrals: Math.floor(
            (dashboardData?.referralStats?.totalReferrals || 12) * 0.8,
          ),
          referralEarnings:
            dashboardData?.referralStats?.referralEarnings || 240,
          monthlyGrowth: monthlyReferralGrowth,
        },
        progressStats: {
          currentLevel: dashboardData?.user.currentPosition?.name || "Intern",
          nextLevel: `L${(dashboardData?.user.currentPosition?.level || 0) + 1}`,
          progressToNext: Math.random() * 100,
          daysActive: Math.floor(Math.random() * 90) + 30,
        },
      },
      revenueBreakdown,
      performanceMetrics: {
        averageEarningsPerVideo: 5.2,
        completionRate: 94.5,
        streakDays: 7,
        totalVideoHours: 145.5,
      },
    };
  };

  const fetchUserAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.append("timePeriod", timePeriod);

      const response = await fetch(
        `/api/user/analytics?${searchParams.toString()}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("User analytics API error response:", errorText);

        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error ||
            result.message ||
            "Failed to fetch user analytics data",
        );
      }

      if (result.data) {
        setData(result.data);
      } else {
        // Fallback to mock data if API returns no data
        const mockData = generateMockData(dashboardData);
        setData(mockData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user analytics";
      setError(errorMessage);
      console.error("User analytics fetch error:", err);

      // Fallback to mock data on error
      const mockData = generateMockData(dashboardData);
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAnalytics();
  }, [timePeriod, dashboardData]);

  return {
    data,
    loading,
    error,
    refetch: fetchUserAnalytics,
  };
}
