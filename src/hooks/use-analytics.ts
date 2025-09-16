"use client";

import { useState, useEffect } from "react";
import { AnalyticsData, ApiResponse } from "@/types/admin";

interface UseAnalyticsParams {
  dateFrom?: Date;
  dateTo?: Date;
  timePeriod?: "daily" | "weekly" | "monthly" | "yearly";
  autoFetch?: boolean;
  initialData?: AnalyticsData;
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAnalytics({
  dateFrom,
  dateTo,
  timePeriod = "monthly",
  autoFetch = true,
  initialData,
}: UseAnalyticsParams = {}): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (dateFrom) {
        searchParams.append("dateFrom", dateFrom.toISOString());
      }

      if (dateTo) {
        searchParams.append("dateTo", dateTo.toISOString());
      }

      searchParams.append("timePeriod", timePeriod);

      const response = await fetch(
        `/api/admin/analytics?${searchParams.toString()}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Analytics API error response:", errorText);

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

      const result: ApiResponse<AnalyticsData> = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || result.message || "Failed to fetch analytics data",
        );
      }

      if (result.data) {
        setData(result.data);
      } else {
        // Set default empty data structure
        setData({
          overview: {
            totalRevenue: 0,
            revenueGrowth: 0,
            totalUsers: 0,
            userGrowth: 0,
            totalVideoViews: 0,
            videoViewGrowth: 0,
            activeUsers: 0,
            activeUserChange: 0,
          },
          userIncome: {
            monthly: [],
            weekly: [],
            yearly: [],
          },
          videoViews: {
            daily: [],
            weekly: [],
            monthly: [],
          },
          topVideos: [],
          topUsers: [],
          revenueBreakdown: [],
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics();
    }
  }, [dateFrom, dateTo, timePeriod, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
