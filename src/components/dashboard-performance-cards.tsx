"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  Activity,
  Target,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Play,
  UserCheck,
  Heart,
  Clock,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface PerformanceMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<any>;
  trend: "up" | "down" | "neutral";
  color: "blue" | "green" | "orange" | "purple" | "red" | "indigo";
  badge?: string;
  progress?: number;
  target?: number;
  description?: string;
}

interface DashboardPerformanceCardsProps {
  className?: string;
  showProgress?: boolean;
  gridCols?: 2 | 3 | 4;
  compactView?: boolean;
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

// Individual Performance Card Component
const PerformanceCard: React.FC<{
  metric: PerformanceMetric;
  compactView: boolean;
  showProgress: boolean;
  isLoading?: boolean;
}> = ({ metric, compactView, showProgress, isLoading = false }) => {
  const colors = colorConfig[metric.color];
  const trendIcon = metric.trend === "up" ? ArrowUpRight : metric.trend === "down" ? ArrowDownRight : Minus;
  const TrendIcon = trendIcon;
  const trendColor = metric.trend === "up" ? "text-emerald-600" : metric.trend === "down" ? "text-red-600" : "text-gray-600";

  if (isLoading) {
    return (
      <Card className="h-full border-0 shadow-lg animate-pulse">
        <CardContent className={cn("p-4", compactView ? "p-3" : "p-6")}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className={cn("rounded-xl bg-gray-200", compactView ? "w-8 h-8" : "w-12 h-12")} />
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className={cn("bg-gray-200 rounded", compactView ? "h-6 w-16" : "h-8 w-20")} />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <div className="h-3 bg-gray-200 rounded w-10" />
              <div className="h-2 bg-gray-200 rounded w-12" />
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
      whileHover={{ y: -2, scale: 1.02 }}
      className="group cursor-pointer h-full"
    >
      <Card className={cn(
        "h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative ring-1",
        colors.ring
      )}>
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-300",
          colors.bg
        )} />

        <CardContent className={cn("relative", compactView ? "p-4" : "p-6")}>
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "inline-flex rounded-xl bg-gradient-to-br text-white shadow-lg",
                  colors.bg,
                  compactView ? "p-2" : "p-3"
                )}>
                  <metric.icon className={cn(compactView ? "w-4 h-4" : "w-5 h-5")} />
                </div>
                {metric.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {metric.badge}
                  </Badge>
                )}
              </div>

              <div>
                <p className={cn("font-medium text-gray-600", compactView ? "text-xs" : "text-sm")}>
                  {metric.title}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className={cn("font-bold text-gray-900", compactView ? "text-xl" : "text-2xl")}>
                    {typeof metric.value === "number" && metric.value > 1000
                      ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(metric.value)
                      : typeof metric.value === "number"
                        ? metric.value.toLocaleString()
                        : metric.value}
                  </h3>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className={cn("flex items-center gap-1", trendColor)}>
                <TrendIcon className="w-3 h-3" />
                <span className={cn("font-semibold", compactView ? "text-xs" : "text-sm")}>
                  {metric.change > 0 ? "+" : ""}{metric.change}%
                </span>
              </div>
              <p className={cn("text-gray-500 mt-1", compactView ? "text-xs" : "text-xs")}>
                {metric.changeLabel}
              </p>
            </div>
          </div>

          {showProgress && metric.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{metric.progress}%</span>
              </div>
              <Progress value={metric.progress} className="h-1.5" />
              {metric.target && (
                <p className="text-xs text-gray-500">
                  Target: {metric.target.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {metric.description && !compactView && (
            <p className="text-xs text-gray-500 mt-2">
              {metric.description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Dashboard Performance Cards Component
export const DashboardPerformanceCards: React.FC<DashboardPerformanceCardsProps> = ({
  className,
  showProgress = true,
  gridCols = 4,
  compactView = false,
}) => {
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard-performance"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const result = await response.json();
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Generate performance metrics from dashboard data
  const performanceMetrics = useMemo((): PerformanceMetric[] => {
    if (!dashboardData) {
      // Return mock data for loading state
      return [
        {
          id: "revenue",
          title: "Total Revenue",
          value: "PKR 0",
          change: 0,
          changeLabel: "vs last month",
          icon: DollarSign,
          trend: "neutral",
          color: "green",
          badge: "Revenue",
          progress: 0,
          target: 100000,
          description: "Total earnings from platform activities"
        },
        {
          id: "users",
          title: "Active Users",
          value: 0,
          change: 0,
          changeLabel: "vs last month",
          icon: Users,
          trend: "neutral",
          color: "blue",
          badge: "Growth",
          description: "Currently active platform users"
        },
        {
          id: "videos",
          title: "Video Views",
          value: 0,
          change: 0,
          changeLabel: "vs last month",
          icon: Eye,
          trend: "neutral",
          color: "purple",
          badge: "Content",
          description: "Total video views across platform"
        },
        {
          id: "engagement",
          title: "Engagement Rate",
          value: "0%",
          change: 0,
          changeLabel: "vs last month",
          icon: Activity,
          trend: "neutral",
          color: "orange",
          badge: "Quality",
          description: "User engagement and interaction rate"
        }
      ];
    }

    // Calculate metrics from actual data
    const totalRevenue = dashboardData.totalEarnings || 0;
    const totalUsers = dashboardData.totalUsers || 0;
    const totalVideos = dashboardData.totalVideos || 0;
    const revenueGrowth = dashboardData.revenueGrowth || 0;
    const userGrowth = dashboardData.userGrowth || 0;
    const videoGrowth = dashboardData.videoGrowth || 0;
    const engagementRate = dashboardData.engagementRate || 0;
    const engagementChange = dashboardData.engagementChange || 0;

    return [
      {
        id: "revenue",
        title: "Total Revenue",
        value: `PKR ${totalRevenue.toLocaleString()}`,
        change: revenueGrowth,
        changeLabel: "vs last month",
        icon: DollarSign,
        trend: revenueGrowth >= 0 ? "up" : "down",
        color: "green",
        badge: "Revenue",
        progress: Math.min((totalRevenue / 100000) * 100, 100),
        target: 100000,
        description: "Total earnings from platform activities"
      },
      {
        id: "users",
        title: "Active Users",
        value: totalUsers,
        change: userGrowth,
        changeLabel: "vs last month",
        icon: Users,
        trend: userGrowth >= 0 ? "up" : "down",
        color: "blue",
        badge: "Growth",
        description: "Currently active platform users"
      },
      {
        id: "videos",
        title: "Video Views",
        value: totalVideos,
        change: videoGrowth,
        changeLabel: "vs last month",
        icon: Eye,
        trend: videoGrowth >= 0 ? "up" : "down",
        color: "purple",
        badge: "Content",
        description: "Total video views across platform"
      },
      {
        id: "engagement",
        title: "Engagement Rate",
        value: `${engagementRate}%`,
        change: engagementChange,
        changeLabel: "vs last month",
        icon: Activity,
        trend: engagementChange >= 0 ? "up" : "down",
        color: "orange",
        badge: "Quality",
        description: "User engagement and interaction rate"
      },
      {
        id: "retention",
        title: "User Retention",
        value: `${dashboardData.retentionRate || 75}%`,
        change: dashboardData.retentionChange || 5.2,
        changeLabel: "vs last month",
        icon: Heart,
        trend: (dashboardData.retentionChange || 5.2) >= 0 ? "up" : "down",
        color: "red",
        badge: "Loyalty",
        description: "User retention and platform loyalty"
      },
      {
        id: "performance",
        title: "Platform Score",
        value: `${dashboardData.platformScore || 8.5}/10`,
        change: dashboardData.scoreChange || 4.1,
        changeLabel: "vs last month",
        icon: Award,
        trend: (dashboardData.scoreChange || 4.1) >= 0 ? "up" : "down",
        color: "indigo",
        badge: "Quality",
        description: "Overall platform performance score"
      }
    ];
  }, [dashboardData]);

  // Get grid columns class
  const gridColsClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }[gridCols];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className={cn("font-bold text-gray-900", compactView ? "text-xl" : "text-2xl")}>
            Platform Performance
          </h2>
          <p className={cn("text-gray-600", compactView ? "text-sm" : "text-base")}>
            Track your platform performance and user engagement
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
          Live
        </Badge>
      </motion.div>

      {/* Performance Cards Grid */}
      <div className={cn("grid gap-4", gridColsClass)}>
        {performanceMetrics.slice(0, gridCols === 2 ? 4 : gridCols === 3 ? 6 : 6).map((metric, index) => (
          <PerformanceCard
            key={metric.id}
            metric={metric}
            compactView={compactView}
            showProgress={showProgress && index < 2} // Show progress only on first 2 cards
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Quick Stats Bar */}
      {!compactView && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Session Duration", value: "4m 32s", icon: Clock, color: "text-blue-600" },
            { label: "Conversion Rate", value: "3.2%", icon: Target, color: "text-green-600" },
            { label: "Daily Active", value: dashboardData?.dailyActive || 0, icon: UserCheck, color: "text-purple-600" },
            { label: "Top Rating", value: "4.8★", icon: Star, color: "text-amber-600" },
          ].map((stat, index) => (
            <div key={stat.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <div>
                <div className="text-sm font-semibold">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPerformanceCards;
