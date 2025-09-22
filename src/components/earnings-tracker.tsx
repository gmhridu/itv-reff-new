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
import {
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  Users,
  Gift,
  Shield,
  Star,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Zap,
  Calendar,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EarningsData {
  success: boolean;
  data: {
    summary: {
      today: number;
      yesterday: number;
      thisWeek: number;
      thisMonth: number;
      allTime: number;
    };
    breakdown: {
      dailyTaskCommission: number;
      referralInviteCommission: {
        level1: number;
        level2: number;
        level3: number;
        total: number;
      };
      referralTaskCommission: {
        level1: number;
        level2: number;
        level3: number;
        total: number;
      };
      topupBonus: number;
      specialCommission: number;
      totalEarning: number;
    };
    security: {
      totalRefunds: number;
      refundHistory: any[];
    };
    wallet: {
      mainWallet: number;
      commissionWallet: number;
      totalAvailableForWithdrawal: number;
    };
    recentTransactions: any[];
  };
}

interface EarningsTrackerProps {
  refreshInterval?: number;
  showDetailed?: boolean;
}

export const EarningsTracker: React.FC<EarningsTrackerProps> = ({
  refreshInterval = 30000, // 30 seconds default
  showDetailed = true,
}) => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [showSensitive, setShowSensitive] = useState(false);
  const [previousData, setPreviousData] = useState<EarningsData | null>(null);
  const [changeIndicators, setChangeIndicators] = useState<{
    [key: string]: 'up' | 'down' | 'same';
  }>({});

  const { toast } = useToast();

  // Fetch earnings data
  const fetchEarningsData = async (showToast = false) => {
    try {
      const response = await fetch("/api/user/earnings");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Compare with previous data for change indicators
          if (earningsData && showDetailed) {
            const changes: { [key: string]: 'up' | 'down' | 'same' } = {};

            // Compare today's earnings
            const todayChange = data.data.summary.today - earningsData.data.summary.today;
            changes.today = todayChange > 0 ? 'up' : todayChange < 0 ? 'down' : 'same';

            // Compare total earnings
            const totalChange = data.data.breakdown.totalEarning - earningsData.data.breakdown.totalEarning;
            changes.total = totalChange > 0 ? 'up' : totalChange < 0 ? 'down' : 'same';

            setChangeIndicators(changes);

            // Show notification for new earnings
            if (todayChange > 0 && showToast) {
              toast({
                title: "New Earnings! 🎉",
                description: `You earned PKR ${todayChange.toFixed(2)} today!`,
                duration: 5000,
              });
            }
          }

          setPreviousData(earningsData);
          setEarningsData(data);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error("Error fetching earnings data:", error);
      toast({
        title: "Update Failed",
        description: "Failed to refresh earnings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchEarningsData();

    let interval: NodeJS.Timeout;
    if (isAutoRefresh) {
      interval = setInterval(() => {
        fetchEarningsData(true);
      }, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefresh, refreshInterval]);

  // Manual refresh
  const handleManualRefresh = () => {
    setLoading(true);
    fetchEarningsData(true);
  };

  // Format currency
  const formatCurrency = (amount: number, hideIfSensitive = false) => {
    if (hideIfSensitive && !showSensitive) {
      return "****";
    }
    return `PKR ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Get change indicator component
  const getChangeIndicator = (key: string) => {
    const change = changeIndicators[key];
    if (!change || change === 'same') return null;

    return change === 'up' ? (
      <ArrowUp className="w-3 h-3 text-green-500 animate-bounce" />
    ) : (
      <ArrowDown className="w-3 h-3 text-red-500" />
    );
  };

  if (loading && !earningsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            Earnings Tracker
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
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Real-time Earnings Tracker</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live tracking your earnings
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSensitive(!showSensitive)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 opacity-80" />
              {getChangeIndicator('today')}
            </div>
            <p className="text-sm opacity-90">Today's Earnings</p>
            <p className="text-xl font-bold">
              {formatCurrency(earningsData?.data?.summary?.today || 0, true)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 opacity-80" />
              <Zap className="w-4 h-4 opacity-80" />
            </div>
            <p className="text-sm opacity-90">This Week</p>
            <p className="text-xl font-bold">
              {formatCurrency(earningsData?.data?.summary?.thisWeek || 0, true)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-sm opacity-90">This Month</p>
            <p className="text-xl font-bold">
              {formatCurrency(earningsData?.data?.summary?.thisMonth || 0, true)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 opacity-80" />
              {getChangeIndicator('total')}
            </div>
            <p className="text-sm opacity-90">Total Earned</p>
            <p className="text-xl font-bold">
              {formatCurrency(earningsData?.data?.breakdown?.totalEarning || 0, true)}
            </p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {showDetailed && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Earnings Breakdown</h3>
              <Badge variant="secondary" className="text-xs">
                Real-time
              </Badge>
            </div>

            <div className="grid gap-3">
              {/* Daily Tasks */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">Daily Task Commission</span>
                </div>
                <span className="font-bold text-blue-600">
                  {formatCurrency(earningsData?.data?.breakdown?.dailyTaskCommission || 0)}
                </span>
              </div>

              {/* Referral Commissions */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">Referral Commissions</span>
                </div>
                <span className="font-bold text-green-600">
                  {formatCurrency(
                    (earningsData?.data?.breakdown?.referralInviteCommission?.total || 0) +
                    (earningsData?.data?.breakdown?.referralTaskCommission?.total || 0)
                  )}
                </span>
              </div>

              {/* Special Earnings */}
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">Bonuses & Special</span>
                </div>
                <span className="font-bold text-purple-600">
                  {formatCurrency(
                    (earningsData?.data?.breakdown?.topupBonus || 0) +
                    (earningsData?.data?.breakdown?.specialCommission || 0)
                  )}
                </span>
              </div>

              {/* Security Refunds */}
              {(earningsData?.data?.security?.totalRefunds || 0) > 0 && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">Security Refunds</span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(earningsData?.data?.security?.totalRefunds || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-refresh Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {lastUpdated ? (
              <span>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            ) : (
              <span>Never updated</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={isAutoRefresh ? "bg-green-50 border-green-200" : ""}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${isAutoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {isAutoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsTracker;
