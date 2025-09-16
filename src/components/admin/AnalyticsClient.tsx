"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  RefreshCw,
  Download,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Users,
  DollarSign,
  Eye,
  Activity,
  Database,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { AnalyticsTimeRange } from "@/types/admin-enums";
import { useAnalytics } from "@/hooks/use-analytics";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AnalyticsData } from "@/types/admin";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="rounded-full bg-muted/50 p-6 mb-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} className="min-w-[140px]">
          <PlusCircle className="h-4 w-4 mr-2" />
          {actionText}
        </Button>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  growth,
  icon: Icon,
  format = "number",
}: {
  title: string;
  value: number;
  growth: number;
  icon: React.ComponentType<{ className?: string }>;
  format?: "number" | "currency";
}) {
  const formatValue = (val: number) => {
    if (format === "currency") {
      return new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
      }).format(val);
    }
    return new Intl.NumberFormat("en-US").format(val);
  };

  const isPositive = growth >= 0;
  const GrowthIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold">{formatValue(value)}</p>
          <div className="flex items-center text-xs">
            <GrowthIcon
              className={`h-3 w-3 mr-1 ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            />
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {Math.abs(growth).toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-1">from last period</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AnalyticsClientProps {
  initialData?: AnalyticsData;
}

export function AnalyticsClient({ initialData }: AnalyticsClientProps = {}) {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>(
    AnalyticsTimeRange.MONTHLY,
  );
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");

  // Calculate date range based on time range selection
  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    switch (timeRange) {
      case AnalyticsTimeRange.WEEKLY:
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateTo = now;
        break;
      case AnalyticsTimeRange.MONTHLY:
        dateFrom = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        dateTo = now;
        break;
      case AnalyticsTimeRange.YEARLY:
        dateFrom = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate(),
        );
        dateTo = now;
        break;
      case AnalyticsTimeRange.CUSTOM:
        if (customDateFrom) dateFrom = new Date(customDateFrom);
        if (customDateTo) dateTo = new Date(customDateTo);
        break;
      default:
        dateFrom = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        dateTo = now;
    }

    return { dateFrom, dateTo };
  }, [timeRange, customDateFrom, customDateTo]);

  const {
    data: analyticsData,
    loading,
    error,
    refetch,
  } = useAnalytics({
    dateFrom,
    dateTo,
    timePeriod,
    autoFetch: !initialData, // Don't auto-fetch if we have initial data
    initialData, // Pass initial data to the hook
  });

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as AnalyticsTimeRange);

    // Update time period based on range
    switch (value as AnalyticsTimeRange) {
      case AnalyticsTimeRange.WEEKLY:
        setTimePeriod("daily");
        break;
      case AnalyticsTimeRange.MONTHLY:
        setTimePeriod("weekly");
        break;
      case AnalyticsTimeRange.YEARLY:
        setTimePeriod("monthly");
        break;
      default:
        setTimePeriod("monthly");
    }
  };

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success("Analytics data refreshed successfully");
  }, [refetch]);

  const handleExportData = useCallback(() => {
    if (!analyticsData) {
      toast.error("No data available to export");
      return;
    }

    try {
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `analytics-${timeRange.toLowerCase()}-${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      toast.success("Analytics data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export analytics data");
    }
  }, [analyticsData, timeRange]);

  // Check if data is truly empty (no activity at all)
  const isDataEmpty =
    analyticsData &&
    analyticsData.overview.totalRevenue === 0 &&
    analyticsData.overview.totalUsers === 0 &&
    analyticsData.overview.totalVideoViews === 0 &&
    analyticsData.topVideos.length === 0 &&
    analyticsData.topUsers.length === 0;

  const hasPartialData = analyticsData && !isDataEmpty;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <div className="rounded-full bg-destructive/10 p-6 mx-auto mb-6 w-fit">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-3">
              Unable to Load Analytics
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {error.includes("database") || error.includes("connection")
                ? "There was a problem connecting to the database. Please check your connection and try again."
                : error}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state when no data exists
  if (isDataEmpty) {
    return (
      <div className="space-y-6">
        {/* Time Range Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Time Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AnalyticsTimeRange.WEEKLY}>
                    Last 7 Days
                  </SelectItem>
                  <SelectItem value={AnalyticsTimeRange.MONTHLY}>
                    Last Month
                  </SelectItem>
                  <SelectItem value={AnalyticsTimeRange.YEARLY}>
                    Last Year
                  </SelectItem>
                  <SelectItem value={AnalyticsTimeRange.CUSTOM}>
                    Custom Range
                  </SelectItem>
                </SelectContent>
              </Select>

              {timeRange === AnalyticsTimeRange.CUSTOM && (
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    placeholder="From date"
                  />
                  <Input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    placeholder="To date"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Database}
              title="No Analytics Data Available"
              description="Your analytics dashboard is ready, but there's no data to display yet. Start by adding users, videos, or transactions to see insights about your platform's performance."
              actionText="Refresh Data"
              onAction={handleRefresh}
            />
          </CardContent>
        </Card>

        {/* Getting Started Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold">Add Users</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Start by registering users on your platform to begin tracking
                user growth and engagement metrics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-2">
                  <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold">Upload Videos</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload videos and start tracking views, engagement rates, and
                reward distributions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-2">
                  <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold">Generate Activity</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Encourage user activity like video watching and referrals to
                populate your analytics dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show dashboard with data
  if (hasPartialData) {
    // Transform analytics data to match AnalyticsDashboard props
    const dashboardData = {
      userIncomeData:
        analyticsData.userIncome.monthly.length > 0
          ? analyticsData.userIncome.monthly.map((item) => ({
              month: item.name,
              income: item.value,
              users: 0, // Default value as count is not available in AnalyticsTimeSeriesData
            }))
          : [
              {
                month: "No Data",
                income: 0,
                users: 0,
              },
            ],
      videoMetrics: {
        totalViews: analyticsData.overview.totalVideoViews,
        averageWatchTime: 120, // Default value, could be added to API
        engagementRate:
          analyticsData.topVideos.length > 0
            ? analyticsData.topVideos.reduce(
                (sum, v) => sum + v.engagement,
                0,
              ) / analyticsData.topVideos.length
            : 0,
        topVideos: analyticsData.topVideos.map((video) => ({
          id: video.id,
          title: video.title,
          views: video.views,
          earnings: video.totalRewardsPaid,
        })),
      },
      userGrowth:
        analyticsData.userIncome.monthly.length > 0
          ? analyticsData.userIncome.monthly.map((item, index) => ({
              date: item.name,
              newUsers: Math.max(
                0,
                item.value -
                  (index > 0
                    ? analyticsData.userIncome.monthly[index - 1]?.value || 0
                    : 0),
              ),
              totalUsers: item.value,
            }))
          : [
              {
                date: "No Data",
                newUsers: 0,
                totalUsers: 0,
              },
            ],
      revenueData: {
        totalRevenue: analyticsData.overview.totalRevenue,
        monthlyRevenue: analyticsData.userIncome.monthly.reduce(
          (sum, item) => sum + item.value,
          0,
        ),
        revenueGrowth: analyticsData.overview.revenueGrowth,
        revenueBySource:
          analyticsData.revenueBreakdown.length > 0
            ? analyticsData.revenueBreakdown.map((item) => ({
                source: item.source,
                amount: item.amount,
                percentage: item.percentage,
              }))
            : [
                {
                  source: "No Revenue Yet",
                  amount: 0,
                  percentage: 0,
                },
              ],
      },
    };

    return (
      <div className="space-y-6">
        {/* Custom Date Range Inputs (shown only when Custom is selected) */}
        {timeRange === AnalyticsTimeRange.CUSTOM && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Custom Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Dashboard */}
        <AnalyticsDashboard
          data={dashboardData}
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onExportData={handleExportData}
        />
      </div>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}
