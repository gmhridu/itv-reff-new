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
  PieChart as PieChartIcon,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Play,
  UserCheck,
  Globe,
  Smartphone,
  Monitor,
  Heart,
  Share2,
  MessageCircle,
  Star,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface PlatformMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalUsers: number;
  userGrowth: number;
  activeUsers: number;
  activeUserGrowth: number;
  totalVideoViews: number;
  videoViewGrowth: number;
  averageSessionDuration: number;
  sessionDurationChange: number;
  conversionRate: number;
  conversionRateChange: number;
  retentionRate: number;
  retentionRateChange: number;
  engagementScore: number;
  engagementScoreChange: number;
}

interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionTime: number;
  bounceRate: number;
  videosPerSession: number;
  socialShares: number;
  comments: number;
  likes: number;
  completionRate: number;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  videoLoadTime: number;
  errorRate: number;
  uptime: number;
  apiResponseTime: number;
  serverHealthScore: number;
}

interface TimeSeriesData {
  timestamp: string;
  date: string;
  value: number;
  label?: string;
}

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

// Color configurations
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

// Enhanced Metric Card Component
const EnhancedMetricCard: React.FC<MetricCardProps> = ({
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

// Main Platform Analytics Dashboard Component
interface PlatformAnalyticsDashboardProps {
  className?: string;
  defaultTimeRange?: string;
  showExportOptions?: boolean;
  showRealTime?: boolean;
}

export const PlatformAnalyticsDashboard: React.FC<
  PlatformAnalyticsDashboardProps
> = ({
  className,
  defaultTimeRange = "30d",
  showExportOptions = true,
  showRealTime = true,
}) => {
  const [timeRange, setTimeRange] = useState(defaultTimeRange);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Mock data fetching - replace with actual API calls
  const { data: platformMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["platform-metrics", timeRange],
    queryFn: async (): Promise<PlatformMetrics> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        totalRevenue: 125420,
        revenueGrowth: 12.5,
        totalUsers: 15420,
        userGrowth: 8.3,
        activeUsers: 3240,
        activeUserGrowth: 15.2,
        totalVideoViews: 89340,
        videoViewGrowth: 22.1,
        averageSessionDuration: 425,
        sessionDurationChange: 5.8,
        conversionRate: 3.2,
        conversionRateChange: 2.1,
        retentionRate: 68.5,
        retentionRateChange: -1.2,
        engagementScore: 8.4,
        engagementScoreChange: 4.3,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: engagementMetrics } = useQuery({
    queryKey: ["engagement-metrics", timeRange],
    queryFn: async (): Promise<EngagementMetrics> => {
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        dailyActiveUsers: 1240,
        weeklyActiveUsers: 4680,
        monthlyActiveUsers: 15420,
        averageSessionTime: 425,
        bounceRate: 32.5,
        videosPerSession: 4.2,
        socialShares: 2340,
        comments: 1890,
        likes: 8920,
        completionRate: 78.5,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: performanceMetrics } = useQuery({
    queryKey: ["performance-metrics", timeRange],
    queryFn: async (): Promise<PerformanceMetrics> => {
      await new Promise((resolve) => setTimeout(resolve, 600));

      return {
        pageLoadTime: 1.2,
        videoLoadTime: 2.8,
        errorRate: 0.05,
        uptime: 99.9,
        apiResponseTime: 145,
        serverHealthScore: 95,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Generate time series data for charts
  const chartData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));

      return {
        timestamp: date.toISOString(),
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: Math.floor(Math.random() * 5000) + 3000,
        users: Math.floor(Math.random() * 200) + 150,
        engagement: Math.floor(Math.random() * 30) + 60,
        performance: Math.floor(Math.random() * 10) + 85,
      };
    });
  }, [timeRange]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Trigger refetch of all queries
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // Export functionality
  const handleExport = useCallback((format: "csv" | "pdf" | "excel") => {
    console.log(`Exporting data as ${format}`);
    // Implement export logic
  }, []);

  const overviewMetrics = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: `$${platformMetrics?.totalRevenue?.toLocaleString() || 0}`,
        change: platformMetrics?.revenueGrowth || 0,
        changeLabel: "vs last period",
        icon: DollarSign,
        trend:
          (platformMetrics?.revenueGrowth || 0) >= 0
            ? ("up" as const)
            : ("down" as const),
        color: "green" as const,
        badge: "Revenue",
        target: 150000,
        progress: platformMetrics
          ? (platformMetrics.totalRevenue / 150000) * 100
          : 0,
      },
      {
        title: "Active Users",
        value: platformMetrics?.activeUsers || 0,
        change: platformMetrics?.activeUserGrowth || 0,
        changeLabel: "vs last period",
        icon: Users,
        trend:
          (platformMetrics?.activeUserGrowth || 0) >= 0
            ? ("up" as const)
            : ("down" as const),
        color: "blue" as const,
        badge: "Growth",
      },
      {
        title: "Video Views",
        value: platformMetrics?.totalVideoViews || 0,
        change: platformMetrics?.videoViewGrowth || 0,
        changeLabel: "vs last period",
        icon: Eye,
        trend:
          (platformMetrics?.videoViewGrowth || 0) >= 0
            ? ("up" as const)
            : ("down" as const),
        color: "purple" as const,
        badge: "Content",
      },
      {
        title: "Engagement Score",
        value: `${platformMetrics?.engagementScore || 0}/10`,
        change: platformMetrics?.engagementScoreChange || 0,
        changeLabel: "vs last period",
        icon: Activity,
        trend:
          (platformMetrics?.engagementScoreChange || 0) >= 0
            ? ("up" as const)
            : ("down" as const),
        color: "orange" as const,
        badge: "Quality",
      },
      {
        title: "Conversion Rate",
        value: `${platformMetrics?.conversionRate || 0}%`,
        change: platformMetrics?.conversionRateChange || 0,
        changeLabel: "vs last period",
        icon: Target,
        trend:
          (platformMetrics?.conversionRateChange || 0) >= 0
            ? ("up" as const)
            : ("down" as const),
        color: "indigo" as const,
        badge: "Sales",
      },
      {
        title: "Retention Rate",
        value: `${platformMetrics?.retentionRate || 0}%`,
        change: platformMetrics?.retentionRateChange || 0,
        changeLabel: "vs last period",
        icon: Heart,
        trend:
          (platformMetrics?.retentionRateChange || 0) >= 0
            ? ("up" as const)
            : ("down" as const),
        color: "red" as const,
        badge: "Loyalty",
      },
    ],
    [platformMetrics],
  );

  const engagementCards = useMemo(
    () => [
      {
        title: "Daily Active Users",
        value: engagementMetrics?.dailyActiveUsers || 0,
        change: 5.2,
        changeLabel: "vs yesterday",
        icon: UserCheck,
        trend: "up" as const,
        color: "blue" as const,
      },
      {
        title: "Session Duration",
        value: `${Math.floor((engagementMetrics?.averageSessionTime || 0) / 60)}m ${(engagementMetrics?.averageSessionTime || 0) % 60}s`,
        change: 8.1,
        changeLabel: "vs last week",
        icon: Clock,
        trend: "up" as const,
        color: "green" as const,
      },
      {
        title: "Videos per Session",
        value: engagementMetrics?.videosPerSession?.toFixed(1) || "0.0",
        change: 12.3,
        changeLabel: "vs last week",
        icon: Play,
        trend: "up" as const,
        color: "purple" as const,
      },
      {
        title: "Completion Rate",
        value: `${engagementMetrics?.completionRate || 0}%`,
        change: -2.1,
        changeLabel: "vs last week",
        icon: CheckCircle,
        trend: "down" as const,
        color: "orange" as const,
      },
    ],
    [engagementMetrics],
  );

  const performanceCards = useMemo(
    () => [
      {
        title: "Page Load Time",
        value: `${performanceMetrics?.pageLoadTime || 0}s`,
        change: -5.2,
        changeLabel: "improvement",
        icon: Zap,
        trend: "up" as const,
        color: "green" as const,
      },
      {
        title: "Uptime",
        value: `${performanceMetrics?.uptime || 0}%`,
        change: 0.1,
        changeLabel: "vs last month",
        icon: CheckCircle,
        trend: "up" as const,
        color: "blue" as const,
      },
      {
        title: "Error Rate",
        value: `${performanceMetrics?.errorRate || 0}%`,
        change: -15.3,
        changeLabel: "improvement",
        icon: AlertCircle,
        trend: "up" as const,
        color: "red" as const,
      },
      {
        title: "API Response Time",
        value: `${performanceMetrics?.apiResponseTime || 0}ms`,
        change: -8.7,
        changeLabel: "improvement",
        icon: Activity,
        trend: "up" as const,
        color: "indigo" as const,
      },
    ],
    [performanceMetrics],
  );

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
            Platform Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            Track your platform performance and user engagement
            {showRealTime && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Live
              </Badge>
            )}
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

          {showExportOptions && (
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </motion.div>

      {/* Main Tabs */}
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
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {overviewMetrics.map((metric, index) => (
              <EnhancedMetricCard
                key={metric.title}
                {...metric}
                isLoading={metricsLoading}
              />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>
                  Daily revenue over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`$${value}`, "Revenue"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  User Activity
                </CardTitle>
                <CardDescription>
                  Active users and engagement trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#8B5CF6"
                      name="Active Users"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      stroke="#F59E0B"
                      name="Engagement %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {engagementCards.map((metric) => (
              <EnhancedMetricCard key={metric.title} {...metric} />
            ))}
          </div>

          {/* Engagement Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>User Engagement Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Visitors", value: 10000, percentage: 100 },
                    { label: "Video Views", value: 7500, percentage: 75 },
                    { label: "Engaged Users", value: 4500, percentage: 45 },
                    { label: "Active Users", value: 3200, percentage: 32 },
                    { label: "Converted Users", value: 1240, percentage: 12.4 },
                  ].map((step, index) => (
                    <div
                      key={step.label}
                      className="flex items-center justify-between"
                    >
                      <span className="font-medium">{step.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${step.percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-16 text-right">
                          {step.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Engagement Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Video Views", value: 45, color: "#3B82F6" },
                        { name: "Social Shares", value: 25, color: "#8B5CF6" },
                        { name: "Comments", value: 20, color: "#F59E0B" },
                        { name: "Likes", value: 10, color: "#10B981" },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[
                        { name: "Video Views", value: 45, color: "#3B82F6" },
                        { name: "Social Shares", value: 25, color: "#8B5CF6" },
                        { name: "Comments", value: 20, color: "#F59E0B" },
                        { name: "Likes", value: 10, color: "#10B981" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceCards.map((metric) => (
              <EnhancedMetricCard key={metric.title} {...metric} />
            ))}
          </div>

          {/* Performance Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                System performance metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="performance"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Performance Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
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
                        Platform revenue increased by 12.5% this month,
                        exceeding targets by 8%.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800">
                        User Engagement
                      </h4>
                      <p className="text-sm text-blue-700">
                        Video completion rate improved to 78.5%, indicating
                        better content quality.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800">
                        Attention Needed
                      </h4>
                      <p className="text-sm text-amber-700">
                        User retention rate decreased by 1.2%. Consider
                        implementing retention campaigns.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-800">
                        Opportunity
                      </h4>
                      <p className="text-sm text-purple-700">
                        Mobile users show 25% higher engagement. Focus on mobile
                        experience optimization.
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
                      Focus on video content creation as it drives 45% of
                      platform engagement.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-800">
                      User Acquisition
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Invest in referral programs - current users bring 3.2x
                      more engaged users.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-gray-800">
                      Performance Optimization
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Reduce page load time to under 1s to improve conversion
                      rates by ~15%.
                    </p>
                  </div>

                  <div className="border-l-4 border-amber-500 pl-4">
                    <h4 className="font-semibold text-gray-800">
                      Retention Focus
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Implement personalized content recommendations to boost
                      retention rates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals and Targets */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Goals & Targets
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
                    current: 125420,
                    target: 150000,
                    unit: "$",
                    color: "green",
                  },
                  {
                    goal: "Active Users",
                    current: 15420,
                    target: 20000,
                    unit: "",
                    color: "blue",
                  },
                  {
                    goal: "Engagement Rate",
                    current: 8.4,
                    target: 9.0,
                    unit: "/10",
                    color: "purple",
                  },
                ].map((goal) => {
                  const percentage = (goal.current / goal.target) * 100;
                  const isOnTrack = percentage >= 80;

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

export default PlatformAnalyticsDashboard;
