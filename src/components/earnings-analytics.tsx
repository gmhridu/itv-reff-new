"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Users,
  DollarSign,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  Gift,
  Shield,
  Zap,
} from "lucide-react";

interface EarningsAnalytics {
  dailyTrend: {
    date: string;
    amount: number;
  }[];
  weeklyComparison: {
    thisWeek: number;
    lastWeek: number;
    change: number;
    changePercent: number;
  };
  monthlyGrowth: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
    growthPercent: number;
  };
  topEarningCategories: {
    category: string;
    amount: number;
    percentage: number;
    icon: any;
    color: string;
  }[];
  projectedEarnings: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  milestones: {
    name: string;
    target: number;
    current: number;
    progress: number;
  }[];
}

interface EarningsAnalyticsProps {
  earningsData?: any;
  className?: string;
}

export const EarningsAnalytics: React.FC<EarningsAnalyticsProps> = ({
  earningsData,
  className = "",
}) => {
  const [analytics, setAnalytics] = useState<EarningsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (earningsData) {
      generateAnalytics(earningsData);
    }
  }, [earningsData]);

  const generateAnalytics = (data: any) => {
    const breakdown = data.data?.breakdown || {};
    const summary = data.data?.summary || {};
    const security = data.data?.security || {};

    // Generate daily trend (mock data for demo)
    const dailyTrend = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      amount: Math.random() * (summary.today || 100) + 50,
    }));

    // Weekly comparison
    const weeklyComparison = {
      thisWeek: summary.thisWeek || 0,
      lastWeek: (summary.thisWeek || 0) * 0.85, // Mock last week data
      change: (summary.thisWeek || 0) * 0.15,
      changePercent: 15,
    };

    // Monthly growth
    const monthlyGrowth = {
      thisMonth: summary.thisMonth || 0,
      lastMonth: (summary.thisMonth || 0) * 0.92, // Mock last month data
      growth: (summary.thisMonth || 0) * 0.08,
      growthPercent: 8,
    };

    // Top earning categories
    const topEarningCategories = [
      {
        category: "Daily Tasks",
        amount: breakdown.dailyTaskCommission || 0,
        percentage: ((breakdown.dailyTaskCommission || 0) / (breakdown.totalEarning || 1)) * 100,
        icon: Target,
        color: "bg-blue-500",
      },
      {
        category: "Referral Invites",
        amount: breakdown.referralInviteCommission?.total || 0,
        percentage: ((breakdown.referralInviteCommission?.total || 0) / (breakdown.totalEarning || 1)) * 100,
        icon: Users,
        color: "bg-green-500",
      },
      {
        category: "Task Commissions",
        amount: breakdown.referralTaskCommission?.total || 0,
        percentage: ((breakdown.referralTaskCommission?.total || 0) / (breakdown.totalEarning || 1)) * 100,
        icon: Activity,
        color: "bg-orange-500",
      },
      {
        category: "USDT Bonuses",
        amount: breakdown.topupBonus || 0,
        percentage: ((breakdown.topupBonus || 0) / (breakdown.totalEarning || 1)) * 100,
        icon: Gift,
        color: "bg-purple-500",
      },
      {
        category: "Special Commission",
        amount: breakdown.specialCommission || 0,
        percentage: ((breakdown.specialCommission || 0) / (breakdown.totalEarning || 1)) * 100,
        icon: Star,
        color: "bg-yellow-500",
      },
      {
        category: "Security Refunds",
        amount: security.totalRefunds || 0,
        percentage: ((security.totalRefunds || 0) / ((breakdown.totalEarning || 0) + (security.totalRefunds || 0))) * 100,
        icon: Shield,
        color: "bg-emerald-500",
      },
    ].filter(cat => cat.amount > 0).sort((a, b) => b.amount - a.amount);

    // Projected earnings based on current trends
    const dailyAverage = (summary.thisWeek || 0) / 7;
    const projectedEarnings = {
      daily: dailyAverage,
      weekly: dailyAverage * 7,
      monthly: dailyAverage * 30,
    };

    // Milestones
    const currentTotal = breakdown.totalEarning || 0;
    const milestones = [
      {
        name: "First PKR 1,000",
        target: 1000,
        current: currentTotal,
        progress: Math.min((currentTotal / 1000) * 100, 100),
      },
      {
        name: "PKR 5,000 Club",
        target: 5000,
        current: currentTotal,
        progress: Math.min((currentTotal / 5000) * 100, 100),
      },
      {
        name: "PKR 10,000 Achiever",
        target: 10000,
        current: currentTotal,
        progress: Math.min((currentTotal / 10000) * 100, 100),
      },
      {
        name: "PKR 25,000 Expert",
        target: 25000,
        current: currentTotal,
        progress: Math.min((currentTotal / 25000) * 100, 100),
      },
    ];

    setAnalytics({
      dailyTrend,
      weeklyComparison,
      monthlyGrowth,
      topEarningCategories,
      projectedEarnings,
      milestones,
    });

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 animate-pulse" />
            Earnings Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Earnings Analytics</CardTitle>
              <CardDescription>
                Deep insights into your earning patterns and growth
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            Smart Analysis
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weekly Comparison */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Weekly Performance</h3>
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">This Week</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(analytics?.weeklyComparison.thisWeek || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getChangeIcon(analytics?.weeklyComparison.change || 0)}
                    <span className={`text-sm font-medium ${getChangeColor(analytics?.weeklyComparison.change || 0)}`}>
                      {formatCurrency(Math.abs(analytics?.weeklyComparison.change || 0))}
                      ({Math.abs(analytics?.weeklyComparison.changePercent || 0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Growth */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Monthly Growth</h3>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(analytics?.monthlyGrowth.thisMonth || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getChangeIcon(analytics?.monthlyGrowth.growth || 0)}
                    <span className={`text-sm font-medium ${getChangeColor(analytics?.monthlyGrowth.growth || 0)}`}>
                      {formatCurrency(Math.abs(analytics?.monthlyGrowth.growth || 0))}
                      ({Math.abs(analytics?.monthlyGrowth.growthPercent || 0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Projected Earnings */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Projected Earnings</h3>
                <Badge variant="secondary" className="text-xs">Based on current trends</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Daily</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(analytics?.projectedEarnings.daily || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Weekly</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(analytics?.projectedEarnings.weekly || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Monthly</p>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(analytics?.projectedEarnings.monthly || 0)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">7-Day Earnings Trend</h3>
              <div className="space-y-3">
                {analytics?.dailyTrend.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 min-w-[60px]">{day.date}</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min((day.amount / Math.max(...(analytics?.dailyTrend.map(d => d.amount) || [1]))) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 min-w-[80px] text-right">
                      {formatCurrency(day.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-6">
            <div className="grid gap-3">
              {analytics?.topEarningCategories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{category.category}</p>
                        <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}% of total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {formatCurrency(category.amount)}
                      </p>
                      <div className="w-20 bg-gray-200 rounded-full h-1 mt-1">
                        <div
                          className={`${category.color} h-1 rounded-full`}
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="space-y-4">
              {analytics?.milestones.map((milestone, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{milestone.name}</h3>
                    <Badge
                      variant={milestone.progress >= 100 ? "default" : "secondary"}
                      className={milestone.progress >= 100 ? "bg-green-500" : ""}
                    >
                      {milestone.progress >= 100 ? "Achieved!" : `${milestone.progress.toFixed(0)}%`}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="text-gray-900">
                        {formatCurrency(milestone.current)} / {formatCurrency(milestone.target)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          milestone.progress >= 100
                            ? "bg-gradient-to-r from-green-500 to-emerald-600"
                            : "bg-gradient-to-r from-blue-500 to-purple-600"
                        }`}
                        style={{ width: `${Math.min(milestone.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EarningsAnalytics;
