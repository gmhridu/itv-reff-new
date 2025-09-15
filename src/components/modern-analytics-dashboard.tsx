"use client";

import React, { useMemo, useState } from "react";
import "../styles/modern-analytics.css";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  PlayCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Award,
  Activity,
  Zap,
  Star,
} from "lucide-react";
import { useUserAnalytics } from "@/hooks/use-user-analytics";
import { DashboardData } from "@/hooks/use-dashboard";

interface ModernAnalyticsDashboardProps {
  className?: string;
  dashboardData?: DashboardData;
}

const GRADIENT_COLORS = {
  primary: {
    start: "#10b981",
    end: "#059669",
    fill: "url(#primaryGradient)",
  },
  secondary: {
    start: "#3b82f6",
    end: "#1d4ed8",
    fill: "url(#secondaryGradient)",
  },
  accent: {
    start: "#f59e0b",
    end: "#d97706",
    fill: "url(#accentGradient)",
  },
  purple: {
    start: "#8b5cf6",
    end: "#7c3aed",
    fill: "url(#purpleGradient)",
  },
};

const PIE_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

// Custom Tooltip Component with Glass Morphism
const ModernTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-lg bg-white/90 border border-white/20 rounded-2xl shadow-2xl p-4 min-w-[200px]">
        <div className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">
          {label}
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 font-medium">
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {typeof entry.value === "number"
                ? entry.dataKey?.includes("amount") ||
                  entry.dataKey?.includes("earnings")
                  ? `$${entry.value.toLocaleString()}`
                  : entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Modern Metric Card with Glassmorphism
const ModernMetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  format = "number",
  trend = "up",
  color = "emerald",
}: {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  format?: "number" | "currency" | "percentage";
  trend?: "up" | "down";
  color?: "emerald" | "blue" | "amber" | "purple";
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return `$${val.toLocaleString()}`;
      case "percentage":
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const colorClasses = {
    emerald: "from-emerald-500 to-teal-600",
    blue: "from-blue-500 to-indigo-600",
    amber: "from-amber-500 to-orange-600",
    purple: "from-purple-500 to-violet-600",
  };

  const iconBgColors = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const isPositive = change >= 0;

  return (
    <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white via-white to-gray-50/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group metric-card">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div
              className={`p-3 rounded-2xl ${iconBgColors[color]} w-fit shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 tracking-wide uppercase">
                {title}
              </p>
              <p className="text-3xl font-black text-gray-900 tracking-tight">
                {formatValue(value)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${
                isPositive
                  ? "text-emerald-700 bg-emerald-100/80"
                  : "text-red-700 bg-red-100/80"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              vs last period
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Modern Chart Card Container
const ModernChartCard = ({
  title,
  description,
  icon: Icon,
  iconColor = "text-emerald-600",
  children,
  className = "",
  headerAction,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}) => {
  return (
    <Card
      className={`border-0 shadow-xl bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 chart-container ${className}`}
    >
      <CardHeader className="pb-4 border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg">
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
            )}
            <div>
              <CardTitle className="text-xl font-black text-gray-900 tracking-tight">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-sm text-gray-600 font-medium mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
};

export function ModernAnalyticsDashboard({
  className,
  dashboardData,
}: ModernAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("monthly");

  const {
    data: userAnalytics,
    loading,
    error,
  } = useUserAnalytics({
    timePeriod: "monthly",
    dashboardData,
  });

  // Mock data for demonstration
  const mockData = useMemo(
    () => ({
      incomeData: [
        { month: "Jan", income: 1200, videos: 45, growth: 12 },
        { month: "Feb", income: 1800, videos: 67, growth: 50 },
        { month: "Mar", income: 2400, videos: 89, growth: 33 },
        { month: "Apr", income: 3200, videos: 123, growth: 33 },
        { month: "May", income: 2800, videos: 98, growth: -12 },
        { month: "Jun", income: 3600, videos: 145, growth: 29 },
        { month: "Jul", income: 4200, videos: 167, growth: 17 },
        { month: "Aug", income: 3800, videos: 156, growth: -10 },
        { month: "Sep", income: 4800, videos: 189, growth: 26 },
      ],
      userGrowthData: [
        { month: "Jan", newUsers: 12, totalUsers: 145, retention: 85 },
        { month: "Feb", newUsers: 18, totalUsers: 163, retention: 87 },
        { month: "Mar", newUsers: 24, totalUsers: 187, retention: 89 },
        { month: "Apr", newUsers: 15, totalUsers: 202, retention: 91 },
        { month: "May", newUsers: 22, totalUsers: 224, retention: 88 },
        { month: "Jun", newUsers: 28, totalUsers: 252, retention: 92 },
        { month: "Jul", newUsers: 19, totalUsers: 271, retention: 90 },
        { month: "Aug", newUsers: 25, totalUsers: 296, retention: 93 },
        { month: "Sep", newUsers: 31, totalUsers: 327, retention: 94 },
      ],
      revenueData: [
        { name: "Video Tasks", value: 45.2, amount: 2260, color: "#10b981" },
        {
          name: "Referral Bonuses",
          value: 28.7,
          amount: 1435,
          color: "#3b82f6",
        },
        { name: "Level Upgrades", value: 16.3, amount: 815, color: "#f59e0b" },
        { name: "Premium Features", value: 9.8, amount: 490, color: "#ef4444" },
      ],
      performanceData: [
        { category: "Nature Docs", views: 1247, earnings: 623, engagement: 94 },
        {
          category: "Tech Reviews",
          views: 1156,
          earnings: 578,
          engagement: 87,
        },
        { category: "Cooking", views: 987, earnings: 494, engagement: 92 },
        { category: "Travel", views: 876, earnings: 438, engagement: 89 },
        { category: "Music", views: 745, earnings: 373, engagement: 85 },
      ],
    }),
    [],
  );

  if (loading) {
    return (
      <div className={`space-y-8 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse border-0 shadow-xl">
            <CardHeader className="space-y-4">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/4"></div>
              <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalRevenue =
    userAnalytics?.revenueBreakdown?.reduce(
      (sum, item) => sum + item.amount,
      0,
    ) || 5000;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Gradient Definitions */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </svg>

      {/* Hero Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 analytics-container">
        <ModernMetricCard
          title="Total Revenue"
          value={totalRevenue}
          change={12.5}
          icon={DollarSign}
          format="currency"
          color="emerald"
        />
        <ModernMetricCard
          title="Active Referrals"
          value={
            userAnalytics?.userGrowth?.referralStats?.totalReferrals || 124
          }
          change={8.3}
          icon={Users}
          color="blue"
        />
        <ModernMetricCard
          title="Video Tasks"
          value={
            userAnalytics?.incomeTracking?.monthly?.reduce(
              (sum, item) => sum + item.videosWatched,
              0,
            ) || 456
          }
          change={15.7}
          icon={PlayCircle}
          color="amber"
        />
        <ModernMetricCard
          title="Performance Score"
          value={userAnalytics?.performanceMetrics?.completionRate || 94}
          change={5.2}
          icon={Target}
          format="percentage"
          color="purple"
        />
      </div>

      {/* Main Analytics Section */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/50 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl glass-morphism">
            <TabsTrigger value="overview" className="rounded-xl font-semibold">
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="rounded-xl font-semibold"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger value="trends" className="rounded-xl font-semibold">
              Trends
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {["daily", "weekly", "monthly"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="capitalize rounded-xl font-semibold modern-button"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value="overview" className="space-y-8 tab-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Income Tracking Chart */}
            <ModernChartCard
              title="Income Analytics"
              description="Revenue trends and video completion metrics"
              icon={TrendingUp}
              iconColor="text-emerald-600"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mockData.incomeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<ModernTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      fill={GRADIENT_COLORS.primary.fill}
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Income"
                    />
                    <Bar
                      dataKey="videos"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                      name="Videos"
                      opacity={0.7}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ModernChartCard>

            {/* User Growth Chart */}
            <ModernChartCard
              title="Growth Metrics"
              description="User acquisition and retention analytics"
              icon={Users}
              iconColor="text-blue-600"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockData.userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                    />
                    <Tooltip content={<ModernTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="newUsers"
                      stackId="1"
                      stroke="#3b82f6"
                      fill={GRADIENT_COLORS.secondary.fill}
                      name="New Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="retention"
                      stackId="2"
                      stroke="#1d4ed8"
                      fill={GRADIENT_COLORS.accent.fill}
                      name="Retention %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ModernChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Sources */}
            <ModernChartCard
              title="Revenue Distribution"
              description="Breakdown of income sources"
              icon={DollarSign}
              iconColor="text-amber-600"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockData.revenueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {mockData.revenueData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<ModernTooltip />}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)}%`,
                        name,
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "20px", fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ModernChartCard>

            {/* Performance Categories */}
            <ModernChartCard
              title="Category Performance"
              description="Top performing content categories"
              icon={Star}
              iconColor="text-purple-600"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockData.performanceData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                      width={100}
                    />
                    <Tooltip content={<ModernTooltip />} />
                    <Bar
                      dataKey="earnings"
                      fill="#8b5cf6"
                      radius={[0, 8, 8, 0]}
                      name="Earnings"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ModernChartCard>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-8 tab-content">
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 card-enter">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg floating-element">
                  <Zap className="h-6 w-6 text-white icon-pulse" />
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-900">
                    {userAnalytics?.performanceMetrics?.streakDays || 15}
                  </div>
                  <div className="text-sm font-semibold text-emerald-700">
                    Day Streak
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-2xl shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-900">
                    $
                    {userAnalytics?.performanceMetrics?.averageEarningsPerVideo?.toFixed(
                      1,
                    ) || "5.2"}
                  </div>
                  <div className="text-sm font-semibold text-blue-700">
                    Avg Per Video
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 rounded-2xl shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-900">
                    {userAnalytics?.performanceMetrics?.completionRate?.toFixed(
                      0,
                    ) || 94}
                    %
                  </div>
                  <div className="text-sm font-semibold text-amber-700">
                    Completion Rate
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-8 tab-content">
          <ModernChartCard
            title="Advanced Trend Analysis"
            description="Deep dive into performance trends"
            icon={TrendingUp}
          >
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData.incomeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                  />
                  <Tooltip content={<ModernTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={{ fill: "#10b981", strokeWidth: 3, r: 6 }}
                    name="Income Trend"
                  />
                  <Line
                    type="monotone"
                    dataKey="growth"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    name="Growth Rate %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ModernChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ModernAnalyticsDashboard;
