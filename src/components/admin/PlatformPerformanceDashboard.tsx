"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  Activity,
  Clock,
  Target,
  Award,
  Zap,
  BarChart3,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Play,
  UserCheck,
  Heart,
  Share2,
  MessageCircle,
  Star,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Database,
  Globe,
  Smartphone,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsData } from "@/types/admin";

// Enhanced metric card component
interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<any>;
  trend: "up" | "down" | "neutral";
  color: "blue" | "green" | "orange" | "purple" | "red" | "indigo";
  subtitle?: string;
  isLoading?: boolean;
  onClick?: () => void;
  badge?: string;
  progress?: number;
  target?: number;
}

const colorConfig = {
  blue: {
    bg: "from-blue-500 to-blue-600",
    text: "text-blue-600",
    light: "bg-blue-50",
    ring: "ring-blue-500/20",
  },
  green: {
    bg: "from-emerald-500 to-emerald-600",
    text: "text-emerald-600",
    light: "bg-emerald-50",
    ring: "ring-emerald-500/20",
  },
  orange: {
    bg: "from-amber-500 to-amber-600",
    text: "text-amber-600",
    light: "bg-amber-50",
    ring: "ring-amber-500/20",
  },
  purple: {
    bg: "from-purple-500 to-purple-600",
    text: "text-purple-600",
    light: "bg-purple-50",
    ring: "ring-purple-500/20",
  },
  red: {
    bg: "from-red-500 to-red-600",
    text: "text-red-600",
    light: "bg-red-50",
    ring: "ring-red-500/20",
  },
  indigo: {
    bg: "from-indigo-500 to-indigo-600",
    text: "text-indigo-600",
    light: "bg-indigo-50",
    ring: "ring-indigo-500/20",
  },
};

const PerformanceMetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
  color,
  subtitle,
  isLoading = false,
  onClick,
  badge,
  progress,
  target,
}) => {
  const colors = colorConfig[color];
  const trendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
        ? "text-red-600"
        : "text-gray-600";

  if (isLoading) {
    return (
      <Card className="h-full border-0 shadow-lg animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-8 bg-gray-200 rounded w-20" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4 bg-gray-200 rounded w-12" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group cursor-pointer h-full"
      onClick={onClick}
    >
      <Card
        className={`h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative ring-1 ${colors.ring}`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
        />

        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colors.bg} text-white shadow-lg`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                {badge && (
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {typeof value === "number" && value > 1000
                      ? new Intl.NumberFormat("en-US", {
                          notation: "compact",
                        }).format(value)
                      : typeof value === "number"
                        ? value.toLocaleString()
                        : value}
                  </h3>
                  {subtitle && (
                    <span className="text-sm text-gray-500">{subtitle}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{changeLabel}</p>
            </div>
          </div>

          {progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {target && (
                <p className="text-xs text-gray-500">
                  Target: {target.toLocaleString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Platform Performance Dashboard
interface PlatformPerformanceDashboardProps {
  initialData?: AnalyticsData;
  className?: string;
}

export const PlatformPerformanceDashboard: React.FC<
  PlatformPerformanceDashboardProps
> = ({ initialData, className }) => {
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch updated analytics data
  const {
    data: analyticsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-analytics", timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/analytics?timePeriod=monthly&dateFrom=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&dateTo=${new Date().toISOString()}`,
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      return result.data;
    },
    initialData,
    staleTime: 5 * 60 * 1000,
  });

  // Process analytics data for display
  const performanceMetrics = useMemo(() => {
    if (!analyticsData) return [];

    return [
      {
        title: "Total Revenue",
        value: `PKR ${analyticsData.overview.totalRevenue?.toLocaleString() || 0}`,
        change: analyticsData.overview.revenueGrowth || 0,
        changeLabel: "vs last period",
        icon: DollarSign,
        trend:
          (analyticsData.overview.revenueGrowth || 0) >= 0
            ? ("up" as const)
            : ("down" as const),
        color: "green" as const,
        badge: "Revenue",
        progress: analyticsData.overview.totalRevenue
          ? Math.min((analyticsData.overview.totalRevenue / 200000) * 100, 100)
          : 0,
        target: 200000,
      },
      {
        title: "Total Users",
        value: analyticsData.overview.totalUsers || 0,
        change: analyticsData.overview.userGrowth || 0,
        changeLabel: "vs last period",
        icon: Users,
        trend:
          (analyticsData.overview.userGrowth || 0) >= 0
            ? ("up" as const)
            : ("down" as const),
        color: "blue" as const,
        badge: "Growth",
      },
      {
        title: "Video Views",
        value: analyticsData.overview.totalVideoViews || 0,
        change: analyticsData.overview.videoViewGrowth || 0,
        changeLabel: "vs last period",
        icon: Eye,
        trend:
          (analyticsData.overview.videoViewGrowth || 0) >= 0
            ? ("up" as const)
            : ("down" as const),
        color: "purple" as const,
        badge: "Content",
      },
      {
        title: "Active Users",
        value: analyticsData.overview.activeUsers || 0,
        change: analyticsData.overview.activeUserChange || 0,
        changeLabel: "vs last period",
        icon: Activity,
        trend:
          (analyticsData.overview.activeUserChange || 0) >= 0
            ? ("up" as const)
            : ("down" as const),
        color: "orange" as const,
        badge: "Engagement",
      },
    ];
  }, [analyticsData]);

  // User engagement metrics
  const engagementMetrics = useMemo(() => {
    if (!analyticsData) return [];

    return [
      {
        title: "Daily Active Users",
        value: Math.floor((analyticsData.overview.activeUsers || 0) * 0.3),
        change: 5.2,
        changeLabel: "vs yesterday",
        icon: UserCheck,
        trend: "up" as const,
        color: "blue" as const,
      },
      {
        title: "Top Videos",
        value: analyticsData.topVideos?.length || 0,
        change: 12.1,
        changeLabel: "vs last week",
        icon: Play,
        trend: "up" as const,
        color: "purple" as const,
      },
      {
        title: "Top Users",
        value: analyticsData.topUsers?.length || 0,
        change: 8.3,
        changeLabel: "vs last week",
        icon: Star,
        trend: "up" as const,
        color: "green" as const,
      },
      {
        title: "Revenue Sources",
        value: analyticsData.revenueBreakdown?.length || 0,
        change: 2.1,
        changeLabel: "vs last week",
        icon: Target,
        trend: "up" as const,
        color: "indigo" as const,
      },
    ];
  }, [analyticsData]);

  // Chart data processing
  const chartData = useMemo(() => {
    if (!analyticsData?.userIncome?.monthly) return [];

    return analyticsData.userIncome.monthly.map((item, index) => ({
      month: item.month || `Month ${index + 1}`,
      revenue: item.totalEarnings || 0,
      users: item.activeUsers || 0,
      videos: item.totalVideos || 0,
    }));
  }, [analyticsData]);

  const revenueBreakdownData = useMemo(() => {
    if (!analyticsData?.revenueBreakdown) return [];

    const colors = ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444"];

    return analyticsData.revenueBreakdown.map((item, index) => ({
      name: item.source || `Source ${index + 1}`,
      value: item.amount || 0,
      percentage: item.percentage || 0,
      color: colors[index % colors.length],
    }));
  }, [analyticsData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  }, [refetch]);

  // Export functionality
  const handleExport = useCallback((format: "csv" | "excel" | "pdf") => {
    console.log(`Exporting analytics data as ${format}`);
    // Implement export logic here
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Platform Performance Dashboard
          </h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            Track your platform performance and user engagement
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
              Live
            </Badge>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Main Analytics Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceMetrics.map((metric) => (
              <PerformanceMetricCard
                key={metric.title}
                {...metric}
                isLoading={isLoading}
              />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Revenue & User Growth
                </CardTitle>
                <CardDescription>
                  Monthly trends and performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        typeof value === "number"
                          ? value.toLocaleString()
                          : value,
                        name === "revenue"
                          ? "Revenue (PKR)"
                          : name === "users"
                            ? "Active Users"
                            : "Videos",
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.2}
                      name="Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  Platform Statistics
                </CardTitle>
                <CardDescription>
                  Key platform metrics at a glance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Total Users</span>
                    </div>
                    <span className="text-xl font-bold text-blue-700">
                      {analyticsData?.overview.totalUsers?.toLocaleString() ||
                        0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Video Views</span>
                    </div>
                    <span className="text-xl font-bold text-green-700">
                      {analyticsData?.overview.totalVideoViews?.toLocaleString() ||
                        0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Active Users</span>
                    </div>
                    <span className="text-xl font-bold text-purple-700">
                      {analyticsData?.overview.activeUsers?.toLocaleString() ||
                        0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Play className="w-5 h-5 text-amber-600" />
                      <span className="font-medium">Top Videos</span>
                    </div>
                    <span className="text-xl font-bold text-amber-700">
                      {analyticsData?.topVideos?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Revenue Breakdown
                </CardTitle>
                <CardDescription>
                  Revenue distribution by source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }) =>
                        `${name}: ${percentage}%`
                      }
                    >
                      {revenueBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `PKR ${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Revenue Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueBreakdownData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          PKR {item.value.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {engagementMetrics.map((metric) => (
              <PerformanceMetricCard key={metric.title} {...metric} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Videos */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-purple-600" />
                  Top Performing Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.topVideos?.slice(0, 5).map((video, index) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-600">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium truncate max-w-48">
                            {video.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {video.views} views
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          PKR {video.totalEarnings}
                        </div>
                        <div className="text-sm text-gray-500">
                          {video.completionRate}% completion
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      No video data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-600" />
                  Top Performing Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.topUsers?.slice(0, 5).map((user, index) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.name || user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.videosWatched} videos watched
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          PKR {user.totalEarnings}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.referrals} referrals
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      No user data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Insights */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800">
                        Revenue Growth
                      </h4>
                      <p className="text-sm text-green-700">
                        Platform revenue shows{" "}
                        {analyticsData?.overview.revenueGrowth > 0
                          ? "positive"
                          : "negative"}{" "}
                        growth of{" "}
                        {Math.abs(analyticsData?.overview.revenueGrowth || 0)}%
                        this period.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800">
                        User Engagement
                      </h4>
                      <p className="text-sm text-blue-700">
                        {analyticsData?.overview.totalUsers} total users with{" "}
                        {analyticsData?.overview.activeUsers} currently active
                        users.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <Eye className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-800">
                        Content Performance
                      </h4>
                      <p className="text-sm text-purple-700">
                        {analyticsData?.overview.totalVideoViews} total video
                        views with strong engagement across the platform.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-800">
                      Content Strategy
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Focus on video content that drives engagement. Top videos
                      show {analyticsData?.topVideos?.[0]?.completionRate || 75}
                      % completion rate.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-800">
                      User Acquisition
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Leverage top users for referral programs - they bring
                      higher quality engagement.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-gray-800">
                      Revenue Optimization
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Optimize{" "}
                      {revenueBreakdownData[0]?.name || "primary revenue"}{" "}
                      source which generates{" "}
                      {revenueBreakdownData[0]?.percentage || 0}% of total
                      revenue.
                    </p>
                  </div>

                  <div className="border-l-4 border-amber-500 pl-4">
                    <h4 className="font-semibold text-gray-800">
                      Platform Growth
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Focus on user retention strategies to maintain{" "}
                      {analyticsData?.overview.userGrowth || 0}% growth rate.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Goals */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Performance Goals & Targets
              </CardTitle>
              <CardDescription>
                Track progress towards quarterly objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    goal: "Revenue Target",
                    current: analyticsData?.overview.totalRevenue || 0,
                    target: 200000,
                    unit: "PKR ",
                    color: "green",
                  },
                  {
                    goal: "User Growth",
                    current: analyticsData?.overview.totalUsers || 0,
                    target: 25000,
                    unit: "",
                    color: "blue",
                  },
                  {
                    goal: "Video Views",
                    current: analyticsData?.overview.totalVideoViews || 0,
                    target: 150000,
                    unit: "",
                    color: "purple",
                  },
                ].map((goal) => {
                  const percentage = (goal.current / goal.target) * 100;
                  const isOnTrack = percentage >= 75;

                  return (
                    <div key={goal.goal} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{goal.goal}</h4>
                        <Badge variant={isOnTrack ? "default" : "secondary"}>
                          {isOnTrack ? "On Track" : "Behind"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            {goal.unit}
                            {goal.current.toLocaleString()}
                          </span>
                          <span className="text-gray-500">
                            {goal.unit}
                            {goal.target.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(percentage, 100)}
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500">
                          {percentage.toFixed(1)}% of target achieved
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformPerformanceDashboard;
