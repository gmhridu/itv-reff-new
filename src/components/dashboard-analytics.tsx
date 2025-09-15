"use client";

import React, { useMemo } from "react";
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
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";
import { useUserAnalytics } from "@/hooks/use-user-analytics";
import { DashboardData } from "@/hooks/use-dashboard";

interface DashboardAnalyticsProps {
  className?: string;
  dashboardData?: DashboardData;
}

const COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.name}:</span>
            <span className="text-sm font-semibold text-gray-900">
              {typeof entry.value === "number" &&
              entry.dataKey?.includes("amount")
                ? `$${entry.value.toFixed(2)}`
                : entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Metric card component
const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  format = "number",
}: {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  format?: "number" | "currency" | "percentage";
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

  const isPositive = change >= 0;

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Icon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(value)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`flex items-center space-x-1 text-sm font-medium ${
                isPositive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs last period</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function DashboardAnalytics({
  className,
  dashboardData,
}: DashboardAnalyticsProps) {
  const {
    data: adminData,
    loading: adminLoading,
    error: adminError,
  } = useAnalytics({
    timePeriod: "monthly",
    autoFetch: false, // We'll use user-specific data instead
  });

  const {
    data: userAnalytics,
    loading,
    error,
  } = useUserAnalytics({
    timePeriod: "monthly",
    dashboardData,
  });

  // Generate mock data for demo if no data available
  const mockIncomeData = useMemo(
    () => [
      { name: "Jan", income: 1200, users: 45 },
      { name: "Feb", income: 1800, users: 67 },
      { name: "Mar", income: 2400, users: 89 },
      { name: "Apr", income: 3200, users: 123 },
      { name: "May", income: 2800, users: 98 },
      { name: "Jun", income: 3600, users: 145 },
      { name: "Jul", income: 4200, users: 167 },
      { name: "Aug", income: 3800, users: 156 },
      { name: "Sep", income: 4800, users: 189 },
    ],
    [],
  );

  const mockUserGrowthData = useMemo(
    () => [
      { name: "Week 1", newUsers: 12, totalUsers: 145 },
      { name: "Week 2", newUsers: 18, totalUsers: 163 },
      { name: "Week 3", newUsers: 24, totalUsers: 187 },
      { name: "Week 4", newUsers: 15, totalUsers: 202 },
      { name: "Week 5", newUsers: 22, totalUsers: 224 },
      { name: "Week 6", newUsers: 28, totalUsers: 252 },
      { name: "Week 7", newUsers: 19, totalUsers: 271 },
    ],
    [],
  );

  const mockRevenueSourcesData = useMemo(
    () => [
      { name: "Video Tasks", value: 45.2, amount: 2260 },
      { name: "Referral Bonuses", value: 28.7, amount: 1435 },
      { name: "Level Upgrades", value: 16.3, amount: 815 },
      { name: "Premium Features", value: 9.8, amount: 490 },
    ],
    [],
  );

  const mockTopVideosData = useMemo(
    () => [
      { name: "Nature Documentary", views: 1247, earnings: 623 },
      { name: "Tech Review", views: 1156, earnings: 578 },
      { name: "Cooking Tutorial", views: 987, earnings: 494 },
      { name: "Travel Vlog", views: 876, earnings: 438 },
      { name: "Music Video", views: 745, earnings: 373 },
    ],
    [],
  );

  // Use user analytics data if available, otherwise use mock data
  const incomeData = userAnalytics?.incomeTracking?.monthly.length
    ? userAnalytics.incomeTracking.monthly.map((item) => ({
        name: item.month,
        income: item.earnings,
        users: item.videosWatched,
      }))
    : mockIncomeData;

  const revenueSourcesData = userAnalytics?.revenueBreakdown.length
    ? userAnalytics.revenueBreakdown.map((item) => ({
        name: item.source,
        value: item.percentage,
        amount: item.amount,
      }))
    : mockRevenueSourcesData;

  const userGrowthData = userAnalytics?.userGrowth?.referralStats?.monthlyGrowth
    .length
    ? userAnalytics.userGrowth.referralStats.monthlyGrowth.map((item) => ({
        name: item.month,
        newUsers: item.newReferrals,
        totalUsers: item.totalReferrals,
      }))
    : mockUserGrowthData;

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={
            userAnalytics?.revenueBreakdown?.reduce(
              (sum, item) => sum + item.amount,
              0,
            ) || 15420
          }
          change={12.5}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Total Referrals"
          value={userAnalytics?.userGrowth?.referralStats?.totalReferrals || 12}
          change={8.3}
          icon={Users}
        />
        <MetricCard
          title="Video Tasks"
          value={
            userAnalytics?.incomeTracking?.monthly?.reduce(
              (sum, item) => sum + item.videosWatched,
              0,
            ) || 156
          }
          change={15.7}
          icon={Eye}
        />
        <MetricCard
          title="Streak Days"
          value={userAnalytics?.performanceMetrics?.streakDays || 7}
          change={5.2}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Income Tracking */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              User Income Tracking
            </CardTitle>
            <CardDescription>
              Monthly income and user growth trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incomeData}>
                  <defs>
                    <linearGradient
                      id="incomeGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                    name="Income"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Growth
            </CardTitle>
            <CardDescription>Daily new user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockUserGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    name="New Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Sources */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              Revenue Sources
            </CardTitle>
            <CardDescription>Breakdown of revenue by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueSourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {revenueSourcesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}%`,
                      name,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Videos */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Top Performing Videos
            </CardTitle>
            <CardDescription>Videos with highest engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockTopVideosData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="views"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    name="Views"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>
            Deep dive into your platform's performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="income" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="income">Income Trends</TabsTrigger>
              <TabsTrigger value="users">User Analytics</TabsTrigger>
              <TabsTrigger value="videos">Video Performance</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
            </TabsList>

            <TabsContent value="income" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={incomeData}>
                    <defs>
                      <linearGradient
                        id="incomeDetailGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#incomeDetailGradient)"
                      name="Monthly Income"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="newUsers"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      name="New Referrals"
                    />
                    <Bar
                      dataKey="totalUsers"
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                      name="Total Referrals"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="videos" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockTopVideosData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="views"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      name="Views"
                    />
                    <Bar
                      dataKey="earnings"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      name="Earnings ($)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    {userAnalytics?.performanceMetrics.streakDays || 7}
                  </div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    $
                    {userAnalytics?.performanceMetrics.averageEarningsPerVideo.toFixed(
                      1,
                    ) || "5.2"}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Per Video</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">
                    {userAnalytics?.performanceMetrics.completionRate.toFixed(
                      0,
                    ) || 94}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="totalUsers"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      name="Total Referrals"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardAnalytics;
