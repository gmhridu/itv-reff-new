"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Users,
  TrendingUp,
  Copy,
  Share2,
  Calendar,
  DollarSign,
  Trophy,
  UserPlus,
  CheckCircle,
  Crown,
  Star,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserData {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  commissionBalance: number;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
}

interface CommissionBreakdown {
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  positionLevel: string;
  commissionAmount: number;
  level: string;
  earnedAt: string;
}

interface BonusBreakdown {
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  taskEarning: number;
  bonusAmount: number;
  level: string;
  earnedAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalReferralEarnings: number;
  referralCommissionEarnings: number;
  bonusEarnings: number;
  monthlyReferrals: number;
  commissionBalance: number;
  totalCommissionEarnings: number;
  totalCommissionCount: number;
  taskBonusEarnings: number;
  taskBonusCount: number;
  commissionBreakdown: CommissionBreakdown[];
  bonusBreakdown: BonusBreakdown[];
  levelEarnings: {
    A_LEVEL: number;
    B_LEVEL: number;
    C_LEVEL: number;
  };
  topReferrals: Array<{
    id: string;
    name: string;
    earnings: number;
    joinedAt: string;
  }>;
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    level: string;
    earnings: number;
    balance: number;
    joinedAt: string;
    isActive: boolean;
    totalCommissionEarned: number;
    totalBonusEarned: number;
  }>;
  stats?: {
    totalReferrals: number;
    registeredReferrals: number;
    qualifiedReferrals: number;
    rewardedReferrals: number;
    totalEarnings: number;
    monthlyReferrals: number;
    activities: Array<any>;
  };
}

export default function ReferralClient() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(
    null
  );
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [processingBonus, setProcessingBonus] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchReferralData();
    fetchReferralStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchReferralData = async () => {
    try {
      const response = await fetch("/api/referral/code");
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    }
  };

  const fetchReferralStats = async () => {
    try {
      const response = await fetch("/api/referral/stats");
      if (response.ok) {
        const data = await response.json();
        // The API returns the stats directly at the root level
        setReferralStats({
          totalReferrals: data.totalReferrals || 0,
          activeReferrals: data.activeReferrals || 0,
          totalReferralEarnings: data.totalCommissionEarnings || 0,
          referralCommissionEarnings: data.referralCommissionEarnings || 0,
          bonusEarnings: data.taskBonusEarnings || 0, // Task bonus earnings from API
          monthlyReferrals: data.monthlyReferrals || 0,
          commissionBalance: data.commissionBalance || 0,
          totalCommissionEarnings: data.totalCommissionEarnings || 0,
          totalCommissionCount: data.totalCommissionCount || 0,
          taskBonusEarnings: data.taskBonusEarnings || 0,
          taskBonusCount: data.taskBonusCount || 0,
          commissionBreakdown: data.commissionBreakdown || [],
          bonusBreakdown: data.bonusBreakdown || [],
          levelEarnings: data.levelEarnings || {
            A_LEVEL: 0,
            B_LEVEL: 0,
            C_LEVEL: 0,
          },
          topReferrals: data.topReferrals || [],
          referrals: data.referrals || [],
          stats: data.stats,
        });
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareReferralLink = async () => {
    if (!referralData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join ICL FINANCE Rewards",
          text: "Use my referral code to earn rewards by watching videos!",
          url: referralData.referralLink,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyToClipboard(referralData.referralLink);
    }
  };

  const processTaskBonus = async () => {
    setProcessingBonus(true);
    try {
      const response = await fetch("/api/referral/task-bonus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`Task bonus processed successfully! ${result.message}`);
          // Refresh the stats
          fetchReferralStats();
        } else {
          alert(`Task bonus processing failed: ${result.message}`);
        }
      } else {
        alert("Failed to process task bonus");
      }
    } catch (error) {
      console.error("Error processing task bonus:", error);
      alert("Error processing task bonus");
    } finally {
      setProcessingBonus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-emerald-500 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">
            Loading referral data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Referral Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
            Referral Program
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Invite friends and earn commission for each person who joins and
            starts watching videos. There is no limit how much you can earn.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold text-emerald-800">
                Total Referrals
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-emerald-900">
                {referralStats?.totalReferrals || 0}
              </div>
              <p className="text-xs text-emerald-600">
                {referralStats?.monthlyReferrals || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold text-blue-800">
                Active Referrals
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-900">
                {referralStats?.activeReferrals || 0}
              </div>
              <p className="text-xs text-blue-600">Earning rewards</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold text-amber-800">
                Commission Earnings
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-amber-900">
                PKR{" "}
                {referralStats?.referralCommissionEarnings?.toFixed(2) ||
                  "0.00"}
              </div>
              <p className="text-xs text-amber-600">
                10% - 3% - 1% on upgrades
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold text-purple-800">
                Bonus Earnings
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-sm">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-purple-900">
                PKR {referralStats?.bonusEarnings?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-purple-600">8% - 3% - 1% on tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Section */}
        <Card className="mb-6 sm:mb-8 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800 text-lg sm:text-xl">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              Your Referral Link
            </CardTitle>
            <CardDescription className="text-gray-600">
              Share this link with friends to earn referral bonuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Referral Code
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm sm:text-lg text-gray-800 break-all">
                    {referralData?.referralCode}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(referralData?.referralCode || "")
                    }
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-300 whitespace-nowrap"
                    size="sm"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">
                      {copied ? "Copied!" : "Copy"}
                    </span>
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Referral Link
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={referralData?.referralLink || ""}
                    readOnly
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 break-all"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(referralData?.referralLink || "")
                      }
                      className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-300"
                      size="sm"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={shareReferralLink}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Details */}
        <Tabs defaultValue="total-referrals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 shadow-sm">
            <TabsTrigger
              value="total-referrals"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-gray-700 font-medium transition-all duration-200"
            >
              <span className="hidden sm:inline">Total Referrals</span>
              <span className="sm:hidden">Total</span>
            </TabsTrigger>
            <TabsTrigger
              value="active-referrals"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-gray-700 font-medium transition-all duration-200"
            >
              <span className="hidden sm:inline">Active Referrals</span>
              <span className="sm:hidden">Active</span>
            </TabsTrigger>
            <TabsTrigger
              value="commission-earnings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white text-gray-700 font-medium transition-all duration-200"
            >
              <span className="hidden sm:inline">Commission Earnings</span>
              <span className="sm:hidden">Commission</span>
            </TabsTrigger>
            <TabsTrigger
              value="bonus-earnings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-700 font-medium transition-all duration-200"
            >
              <span className="hidden sm:inline">Bonus Earnings</span>
              <span className="sm:hidden">Bonus</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="total-referrals" className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800 text-lg sm:text-xl">
                  Total Referrals
                </CardTitle>
                <CardDescription className="text-gray-600">
                  All users who joined using your referral code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralStats?.referrals &&
                referralStats.referrals.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {referralStats.referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-emerald-200 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                              {referral.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {referral.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge
                                variant={
                                  referral.isActive ? "default" : "secondary"
                                }
                                className={`text-xs ${
                                  referral.isActive
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {referral.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {referral.level && (
                                <Badge variant="outline" className="text-xs">
                                  Level {referral.level}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                Joined{" "}
                                {new Date(
                                  referral.joinedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right sm:text-center flex-shrink-0">
                          <p className="font-semibold text-emerald-600 text-sm sm:text-base">
                            PKR{" "}
                            {(
                              referral.totalCommissionEarned +
                              referral.totalBonusEarned
                            ).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">Total Earned</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-700">
                      No referrals yet
                    </h3>
                    <p className="mb-6 text-sm sm:text-base text-gray-600">
                      Start sharing your referral link to earn bonuses!
                    </p>
                    <Button
                      onClick={shareReferralLink}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Your Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active-referrals" className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800 text-lg sm:text-xl">
                  Active Referrals
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Users who are actively earning through your referrals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralStats?.referrals &&
                referralStats.referrals.filter((r) => r.isActive).length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {referralStats.referrals
                      .filter((r) => r.isActive)
                      .map((referral) => (
                        <div
                          key={referral.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-emerald-200 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                {referral.name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {referral.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge className="text-xs bg-green-100 text-green-800">
                                  Active
                                </Badge>
                                {referral.level && (
                                  <Badge variant="outline" className="text-xs">
                                    Level {referral.level}
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  Joined{" "}
                                  {new Date(
                                    referral.joinedAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right sm:text-center flex-shrink-0">
                            <p className="font-semibold text-emerald-600 text-sm sm:text-base">
                              PKR{" "}
                              {(
                                referral.totalCommissionEarned +
                                referral.totalBonusEarned
                              ).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Total Earned
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-700">
                      No active referrals yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Your active referrals will appear here once they start
                      earning.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commission-earnings" className="space-y-6">
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-amber-900 text-lg sm:text-xl flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  Commission Earnings Breakdown
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Earnings from referrals upgrading their position levels (10% -
                  3% - 1%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white/70 rounded-lg border border-amber-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      <h4 className="font-semibold text-amber-900">
                        A-Level (Direct)
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      PKR{" "}
                      {referralStats?.levelEarnings?.A_LEVEL?.toFixed(2) ||
                        "0.00"}
                    </p>
                    <p className="text-sm text-amber-700">
                      10% commission rate
                    </p>
                  </div>

                  <div className="p-4 bg-white/70 rounded-lg border border-amber-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      <h4 className="font-semibold text-amber-900">
                        B-Level (2nd Gen)
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      PKR{" "}
                      {referralStats?.levelEarnings?.B_LEVEL?.toFixed(2) ||
                        "0.00"}
                    </p>
                    <p className="text-sm text-amber-700">3% commission rate</p>
                  </div>

                  <div className="p-4 bg-white/70 rounded-lg border border-amber-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-amber-500" />
                      <h4 className="font-semibold text-amber-900">
                        C-Level (3rd Gen)
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      PKR{" "}
                      {referralStats?.levelEarnings?.C_LEVEL?.toFixed(2) ||
                        "0.00"}
                    </p>
                    <p className="text-sm text-amber-700">1% commission rate</p>
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Detailed Commission History
                  </h4>
                  {referralStats?.commissionBreakdown &&
                  referralStats.commissionBreakdown.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {referralStats.commissionBreakdown.map(
                        (commission, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-800">
                                  {commission.referredUserName}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {commission.positionLevel}
                                </Badge>
                                <Badge
                                  variant={
                                    commission.level === "A_LEVEL"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={`text-xs ${
                                    commission.level === "A_LEVEL"
                                      ? "bg-amber-500 text-white"
                                      : commission.level === "B_LEVEL"
                                        ? "bg-blue-500 text-white"
                                        : "bg-green-500 text-white"
                                  }`}
                                >
                                  {commission.level === "A_LEVEL"
                                    ? "Direct"
                                    : commission.level === "B_LEVEL"
                                      ? "2nd Gen"
                                      : "3rd Gen"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {commission.referredUserEmail}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(
                                  commission.earnedAt
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  commission.earnedAt
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-amber-600">
                                PKR {commission.commissionAmount.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {commission.level === "A_LEVEL"
                                  ? "10%"
                                  : commission.level === "B_LEVEL"
                                    ? "3%"
                                    : "1%"}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-amber-600">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">
                        No commission earnings yet. Share your referral link to
                        start earning!
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center py-6 bg-white/50 rounded-lg">
                  <div className="w-16 h-16 bg-amber-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600 mb-2">
                    PKR{" "}
                    {referralStats?.referralCommissionEarnings?.toFixed(2) ||
                      "0.00"}
                  </p>
                  <p className="text-amber-700 font-medium">
                    Total Commission Earnings
                  </p>
                  <p className="text-sm text-amber-600 mt-2">
                    Earned when your referrals upgrade their position levels
                    (one-time only)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bonus-earnings" className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-purple-900 text-lg sm:text-xl flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Bonus Earnings Breakdown
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Daily bonuses earned when referrals complete 100% of their
                  tasks (8% - 3% - 1%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-white/70 rounded-lg border border-purple-200 shadow-sm">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4" />
                    Bonus Structure (Daily Recurring)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="text-center p-3 bg-purple-100 rounded-lg">
                      <div className="font-bold text-purple-800">
                        Level 1 (Direct)
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        8%
                      </div>
                      <div className="text-xs text-purple-600">
                        of daily earnings
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-100 rounded-lg">
                      <div className="font-bold text-purple-800">
                        Level 2 (2nd Gen)
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        3%
                      </div>
                      <div className="text-xs text-purple-600">
                        of daily earnings
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-100 rounded-lg">
                      <div className="font-bold text-purple-800">
                        Level 3 (3rd Gen)
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        1%
                      </div>
                      <div className="text-xs text-purple-600">
                        of daily earnings
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Recent Bonus History
                  </h4>
                  {referralStats?.bonusBreakdown &&
                  referralStats.bonusBreakdown.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {referralStats.bonusBreakdown.map((bonus, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-800">
                                {bonus.referredUserName}
                              </p>
                              <Badge
                                variant={
                                  bonus.level === "A_LEVEL"
                                    ? "default"
                                    : "secondary"
                                }
                                className={`text-xs ${
                                  bonus.level === "A_LEVEL"
                                    ? "bg-purple-500 text-white"
                                    : bonus.level === "B_LEVEL"
                                      ? "bg-blue-500 text-white"
                                      : "bg-green-500 text-white"
                                }`}
                              >
                                {bonus.level === "A_LEVEL"
                                  ? "Direct"
                                  : bonus.level === "B_LEVEL"
                                    ? "2nd Gen"
                                    : "3rd Gen"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {bonus.referredUserEmail}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">
                                Task earning: PKR {bonus.taskEarning.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(bonus.earnedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600">
                              PKR {bonus.bonusAmount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {bonus.level === "A_LEVEL"
                                ? "8%"
                                : bonus.level === "B_LEVEL"
                                  ? "3%"
                                  : "1%"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-purple-600">
                      <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">
                        No bonus earnings yet. Your referrals need to complete
                        100% of their daily tasks!
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center py-6 bg-white/50 rounded-lg">
                  <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Gift className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600 mb-2">
                    PKR {referralStats?.bonusEarnings?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-purple-700 font-medium">
                    Total Bonus Earnings
                  </p>
                  <p className="text-sm text-purple-600 mt-2">
                    {referralStats?.bonusBreakdown?.length || 0} transactions
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    Earned daily when your referrals complete 100% of their
                    tasks (recurring)
                  </p>
                  {/*  */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* How It Works */}
        <Card className="mt-6 sm:mt-8 bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-gray-800 text-xl sm:text-2xl font-bold mb-2">
              How Referral Program Works
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Simple steps to start earning referral bonuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto mb-4">
                    <Share2 className="h-8 w-8 sm:h-10 sm:w-10 text-white text-center" />
                  </div>
                <h3 className="font-bold mb-3 text-gray-800 text-base sm:text-lg">
                  Share Your Link
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Copy your unique referral link and share it with friends and
                  family
                </p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto mb-4">
                  <UserPlus className="h-8 w-8 sm:h-10 sm:w-10 text-white text-center" />
                </div>

                <h3 className="font-bold mb-3 text-gray-800 text-base sm:text-lg">
                  Friends Join
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Your friends sign up using your referral link and start their
                  journey
                </p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto mb-4">
                  <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-white text-center" />
                </div>
                <h3 className="font-bold mb-3 text-gray-800 text-base sm:text-lg">
                  Earn Commissions
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Get 10% on position upgrades + 8% daily when they complete
                  tasks
                </p>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="mt-8 p-6 bg-white/70 rounded-lg border border-gray-200 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-amber-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Commission Earnings
                  </h4>
                  <p className="text-sm text-gray-600">
                    One-time earnings when referrals upgrade their position
                    levels
                  </p>
                  <div className="mt-2 text-xs text-amber-600 font-medium">
                    10% • 3% • 1%
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Bonus Earnings
                  </h4>
                  <p className="text-sm text-gray-600">
                    Daily recurring bonuses when referrals complete 100% tasks
                  </p>
                  <div className="mt-2 text-xs text-purple-600 font-medium">
                    8% • 3% • 1%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
