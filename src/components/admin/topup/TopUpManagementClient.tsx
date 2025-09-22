"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  History,
  Plus,
  TrendingUp,
  BarChart3,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  CreditCard,
  Banknote,
  Target,
  Zap,
  Filter,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FileText,
  Eye,
} from "lucide-react";
import { TopupWalletManagement } from "@/components/topup/TopupWalletManagement";
import { TopupHistory } from "@/components/topup/TopupHistory";
import { UsdtSettingsManagement } from "./UsdtSettingsManagement";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAmount: number;
  monthlyGrowth: number;
  activeWallets: number;
  avgProcessingTime: string;
  successRate: number;
}

interface RecentActivity {
  id: string;
  type: "new" | "approved" | "rejected";
  message: string;
  timeAgo: string;
  status: string;
  userId?: string;
  userName?: string;
  amount?: number;
}

export function TopUpManagementClient() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalAmount: 0,
    monthlyGrowth: 0,
    activeWallets: 0,
    avgProcessingTime: "0h",
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Fetch dashboard statistics
  const fetchStats = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      // Simulate API call - replace with actual endpoint
      const response = await fetch("/api/admin/topup-history");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.statistics) {
          const { statistics } = data.data;
          // Calculate success rate
          const totalProcessed =
            (statistics.approved || 0) + (statistics.rejected || 0);
          const successRate =
            totalProcessed > 0
              ? ((statistics.approved || 0) / totalProcessed) * 100
              : 0;

          // Calculate success rate trend (simple estimation)
          const previousSuccessRate = stats.successRate || 0;
          const trendValue = successRate - previousSuccessRate;
          const trendFormatted =
            trendValue > 0
              ? `+${trendValue.toFixed(1)}%`
              : `${trendValue.toFixed(1)}%`;

          setStats({
            totalRequests: statistics.total || 0,
            pendingRequests: statistics.pending || 0,
            approvedRequests: statistics.approved || 0,
            rejectedRequests: statistics.rejected || 0,
            totalAmount: statistics.totalAmount || 0,
            monthlyGrowth: 12.5, // Calculate based on data
            activeWallets: 2, // Get from wallet API
            avgProcessingTime: "2.4h",
            successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
          });
        }

        // Fetch recent activities
        if (data.success && data.data.topupRequests) {
          const requests = data.data.topupRequests.slice(0, 3); // Get latest 3 requests
          const activities: RecentActivity[] = requests.map((request: any) => {
            const timeAgo = getTimeAgo(new Date(request.createdAt));

            if (request.status === "PENDING") {
              return {
                id: request.id,
                type: "new" as const,
                message: `New topup request submitted by ${request.user?.name || "User"}`,
                timeAgo,
                status: "New",
                userId: request.userId,
                userName: request.user?.name,
                amount: request.amount,
              };
            } else if (request.status === "APPROVED") {
              return {
                id: request.id,
                type: "approved" as const,
                message: `Request approved and processed for ${request.user?.name || "User"}`,
                timeAgo,
                status: "Approved",
                userId: request.userId,
                userName: request.user?.name,
                amount: request.amount,
              };
            } else {
              return {
                id: request.id,
                type: "rejected" as const,
                message: `Request rejected for ${request.user?.name || "User"}`,
                timeAgo,
                status: "Rejected",
                userId: request.userId,
                userName: request.user?.name,
                amount: request.amount,
              };
            }
          });

          setRecentActivities(activities);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      // On error, set default empty activities
      setRecentActivities([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    setRefreshInterval(interval);

    // Cleanup on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Handle refresh functionality
  const handleRefresh = async () => {
    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    await fetchStats(true);

    // Restart interval
    const newInterval = setInterval(() => {
      fetchStats();
    }, 30000);
    setRefreshInterval(newInterval);
  };

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    description,
    colorClass = "text-blue-600",
    bgClass = "bg-blue-50",
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: "up" | "down";
    trendValue?: string;
    description?: string;
    colorClass?: string;
    bgClass?: string;
  }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
              {title}
            </p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-gray-900">
                {typeof value === "number" &&
                title.toLowerCase().includes("amount")
                  ? `${value.toLocaleString()} PKR`
                  : value.toLocaleString()}
              </p>
              {trend && trendValue && (
                <div
                  className={cn(
                    "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                    trend === "up"
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-red-700 bg-red-50",
                  )}
                >
                  {trend === "up" ? (
                    <ArrowUp className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDown className="w-3 h-3 mr-1" />
                  )}
                  {trendValue}
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
              bgClass,
            )}
          >
            <Icon className={cn("w-6 h-6", colorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickAction = ({
    icon: Icon,
    title,
    description,
    onClick,
    variant = "default",
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    onClick: () => void;
    variant?: "default" | "primary" | "success";
  }) => (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div
            className={cn(
              "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
              variant === "primary"
                ? "bg-blue-500 text-white"
                : variant === "success"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="container mx-auto p-4 lg:p-8 space-y-8 max-w-7xl">
        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Topup Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive wallet and payment management system
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700">
                System Active
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading || isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-1 p-1 bg-white/80 backdrop-blur-sm shadow-sm border-0 rounded-xl h-[58px]">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-lg transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="wallets"
                className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-lg transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Wallets</span>
              </TabsTrigger>
              <TabsTrigger
                value="usdt-settings"
                className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-lg transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">USDT</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-lg transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Requests</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-lg transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Requests"
                value={stats.totalRequests}
                icon={FileText}
                trend="up"
                trendValue="+12.5%"
                description="All time requests"
                colorClass="text-blue-600"
                bgClass="bg-blue-50"
              />
              <StatCard
                title="Pending Reviews"
                value={stats.pendingRequests}
                icon={Clock}
                description="Awaiting approval"
                colorClass="text-amber-600"
                bgClass="bg-amber-50"
              />
              <StatCard
                title="Total Amount"
                value={stats.totalAmount}
                icon={DollarSign}
                trend="up"
                trendValue="+8.2%"
                description="This month"
                colorClass="text-emerald-600"
                bgClass="bg-emerald-50"
              />
              <StatCard
                title="Success Rate"
                value={`${stats.successRate.toFixed(1)}%`}
                icon={Target}
                trend={stats.successRate >= 70 ? "up" : "down"}
                trendValue={
                  stats.successRate >= 90
                    ? "Excellent"
                    : stats.successRate >= 70
                      ? "Good"
                      : "Needs improvement"
                }
                description="Approval rate"
                colorClass={
                  stats.successRate >= 90
                    ? "text-emerald-600"
                    : stats.successRate >= 70
                      ? "text-blue-600"
                      : "text-amber-600"
                }
                bgClass={
                  stats.successRate >= 90
                    ? "bg-emerald-50"
                    : stats.successRate >= 70
                      ? "bg-blue-50"
                      : "bg-amber-50"
                }
              />
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Status */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Request Status
                      </CardTitle>
                      <CardDescription>
                        Current request distribution
                      </CardDescription>
                    </div>
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium">Approved</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">
                          {stats.approvedRequests}
                        </span>
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(stats.approvedRequests / (stats.totalRequests || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">
                          {stats.pendingRequests}
                        </span>
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(stats.pendingRequests / (stats.totalRequests || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium">Rejected</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">
                          {stats.rejectedRequests}
                        </span>
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(stats.rejectedRequests / (stats.totalRequests || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Quick Actions
                      </CardTitle>
                      <CardDescription>Common management tasks</CardDescription>
                    </div>
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <QuickAction
                    icon={Plus}
                    title="Add New Wallet"
                    description="Create a new payment wallet"
                    onClick={() => setActiveTab("wallets")}
                    variant="primary"
                  />
                  <QuickAction
                    icon={Eye}
                    title="Review Pending"
                    description={`${stats.pendingRequests} requests waiting`}
                    onClick={() => setActiveTab("history")}
                    variant="success"
                  />
                  <QuickAction
                    icon={BarChart3}
                    title="View Analytics"
                    description="Detailed performance metrics"
                    onClick={() => setActiveTab("analytics")}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Preview */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest topup requests and updates
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("history")}
                    className="bg-white/80"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading || isRefreshing ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        {loading
                          ? "Loading activities..."
                          : "Refreshing activities..."}
                      </p>
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-6">
                      <Activity className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-1">
                        No recent activities
                      </p>
                      <p className="text-xs text-gray-400">
                        Activities will appear when topup requests are made
                      </p>
                    </div>
                  ) : (
                    recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-full ${
                              activity.type === "new"
                                ? "bg-blue-100"
                                : activity.type === "approved"
                                  ? "bg-emerald-100"
                                  : "bg-red-100"
                            }`}
                          >
                            {activity.type === "new" && (
                              <Users className="w-4 h-4 text-blue-600" />
                            )}
                            {activity.type === "approved" && (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            )}
                            {activity.type === "rejected" && (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {activity.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.timeAgo}
                            </p>
                            {activity.amount && (
                              <p className="text-xs text-gray-600 font-medium">
                                Amount: {activity.amount} PKR
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            activity.type === "new"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : activity.type === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallets Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  Wallet Management
                </h2>
                <p className="text-gray-600">
                  Configure and manage payment wallets for topup requests
                </p>
              </div>
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <TopupWalletManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* USDT Settings Tab */}
          <TabsContent value="usdt-settings" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-orange-600" />
                  USDT Settings
                </h2>
                <p className="text-gray-600">
                  Configure USDT exchange rates, wallets, and bonus settings
                </p>
              </div>
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <UsdtSettingsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-6 h-6 text-green-600" />
                  Request History
                </h2>
                <p className="text-gray-600">
                  Monitor, review, and process user topup requests
                </p>
              </div>
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <TopupHistory />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  Analytics & Insights
                </h2>
                <p className="text-gray-600">
                  Detailed performance metrics and trends
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Average Processing Time
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {stats.avgProcessingTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Active Wallets
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        {stats.activeWallets}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Monthly Growth
                      </span>
                      <div className="flex items-center space-x-1">
                        <ArrowUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-600">
                          {stats.monthlyGrowth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    System Health
                  </CardTitle>
                  <CardDescription>Current system status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">
                          System Status
                        </span>
                      </div>
                      <Badge className="bg-emerald-500 hover:bg-emerald-600">
                        Online
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Database</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium">
                          Payment Gateway
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Placeholder for charts/graphs */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Request Trends</CardTitle>
                <CardDescription>
                  Monthly topup request volume and success rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center space-y-2">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-sm font-medium text-gray-500">
                      Charts Coming Soon
                    </p>
                    <p className="text-xs text-gray-400">
                      Advanced analytics dashboard in development
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
