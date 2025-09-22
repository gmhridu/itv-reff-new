"use client";
import React, { Fragment, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  NotebookPen,
  Share,
  User,
  Wallet,
  TrendingUp,
  Calendar,
  Eye,
  Settings,
  Copy,
  MessageCircle,
  Shield,
  DollarSign,
  Gift,
  Users,
  Target,
  Star,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface UserNavigationBarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

interface WalletData {
  balance: number;
  totalEarnings: number;
}

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
      refundHistory?: Array<{
        id: string;
        fromLevel: number;
        toLevel: number;
        refundAmount: number;
        status: string;
        createdAt: string;
        processedAt?: string;
      }>;
    };
    wallet: {
      mainWallet: number;
      commissionWallet: number;
      totalAvailableForWithdrawal: number;
    };
  };
}

interface UserProfile {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
}

const userNavigationBar: UserNavigationBarItem[] = [
  {
    icon: User,
    label: "Personal Information",
    href: "/user/info",
  },
  {
    icon: NotebookPen,
    label: "Task records",
    href: "/task",
  },
  {
    icon: Share,
    label: "Refer friends",
    href: "/referral",
  },
  {
    icon: Shield,
    label: "Security Refund",
    href: "/user/security-refund",
  },
  {
    icon: MessageCircle,
    label: "Support",
    href: "/user/support",
  },
];

const UserOverview = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        await Promise.all([
          fetchWalletData(),
          fetchEarningsData(),
          fetchUserProfile(),
        ]);
      } catch (err) {
        setError("Failed to load user data. Please try again.");
        console.error("Error loading user data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await fetch("/api/wallet/balance");
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      } else {
        throw new Error(`Failed to fetch wallet data: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast({
        title: "Error",
        description: "Failed to load wallet balance",
        variant: "destructive",
      });
      throw error;
    }
  };

  const fetchEarningsData = async () => {
    try {
      const response = await fetch("/api/user/earnings");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEarningsData(data);
        } else {
          throw new Error(data.error || "Failed to load earnings data");
        }
      } else {
        throw new Error(`Failed to fetch earnings data: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching earnings data:", error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
      throw error;
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      } else {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get initials for avatar
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "UN";
    const names = name.split(" ");
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.substring(0, 4) + "****" + phone.substring(phone.length - 3);
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchWalletData(),
        fetchEarningsData(),
        fetchUserProfile(),
      ]);
      toast({
        title: "Data refreshed",
        description: "Your information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const earningsItems = [
    {
      type: "Yesterday's earnings",
      amount: earningsData?.data?.summary?.yesterday || 0,
      icon: Calendar,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      type: "Today's earnings",
      amount: earningsData?.data?.summary?.today || 0,
      icon: TrendingUp,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      type: "This month's earnings",
      amount: earningsData?.data?.summary?.thisMonth || 0,
      icon: Calendar,
      gradient: "from-purple-500 to-pink-600",
    },
    {
      type: "This week's earnings",
      amount: earningsData?.data?.summary?.thisWeek || 0,
      icon: Calendar,
      gradient: "from-orange-500 to-red-600",
    },
  ];

  const commissionBreakdown = [
    {
      type: "Daily Task Commission",
      amount: earningsData?.data?.breakdown?.dailyTaskCommission || 0,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      type: "Referral Invite Commission",
      amount:
        earningsData?.data?.breakdown?.referralInviteCommission?.total || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      type: "Referral Task Commission",
      amount: earningsData?.data?.breakdown?.referralTaskCommission?.total || 0,
      icon: Share,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      type: "USDT Top-up Bonus (3%)",
      amount: earningsData?.data?.breakdown?.topupBonus || 0,
      icon: Gift,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      type: "Special Commission",
      amount: earningsData?.data?.breakdown?.specialCommission || 0,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      type: "Security Refund",
      amount: earningsData?.data?.security?.totalRefunds || 0,
      icon: Shield,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading ...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg pb-4">
        <div className="flex items-center justify-between p-4">
          <div className="flex flex-col items-center justify-center gap-3 flex-1">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white/30 shadow-lg">
                <AvatarImage src="avatar.jpg" />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                  {getUserInitials(userProfile?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <h2 className="text-lg font-semibold text-white">
                  {userProfile?.name || "User"}
                </h2>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/20 px-3 py-1 rounded-full mt-1">
                <span className="text-blue-100 text-sm">
                  {userProfile ? formatPhoneNumber(userProfile.phone) : "****"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-white hover:bg-white/20"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <Button
            onClick={refreshData}
            variant="ghost"
            size="sm"
            disabled={refreshing}
            className="text-white hover:bg-white/20 absolute top-4 right-4"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Wallet Balance Section - Redesigned */}
      <div className="mx-4 mt-6">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Wallet className="h-6 w-6" />
                My Wallet
              </CardTitle>
              <Link href="/user/wallet">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Balance - Enhanced */}
            <div className="bg-white/20 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100 text-sm font-medium">
                  Current Balance
                </p>
                <Wallet className="w-4 h-4 text-green-200" />
              </div>
              <p className="text-2xl font-bold mb-1">
                PKR{" "}
                {loading ? (
                  <span className="inline-block w-20 h-6 bg-white/30 animate-pulse rounded"></span>
                ) : (
                  earningsData?.data?.wallet?.mainWallet?.toFixed(2) || "0.00"
                )}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-green-200">Main Wallet</p>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Commission Balance & Security Deposited - Enhanced */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/15 rounded-lg p-3 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-green-100 text-xs">Commission Wallet</p>
                  <TrendingUp className="w-3 h-3 text-green-300" />
                </div>
                <p className="text-lg font-bold mb-1">
                  PKR{" "}
                  {loading ? (
                    <span className="inline-block w-16 h-5 bg-white/30 animate-pulse rounded"></span>
                  ) : (
                    earningsData?.data?.wallet?.commissionWallet?.toFixed(2) ||
                    "0.00"
                  )}
                </p>
                <p className="text-xs text-green-300">From tasks & referrals</p>
              </div>
              <div className="bg-white/15 rounded-lg p-3 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-green-100 text-xs">Security Deposited</p>
                  <Shield className="w-3 h-3 text-green-300" />
                </div>
                <p className="text-lg font-bold mb-1">
                  PKR{" "}
                  {loading ? (
                    <span className="inline-block w-16 h-5 bg-white/30 animate-pulse rounded"></span>
                  ) : (
                    walletData?.totalEarnings?.toFixed(2) || "0.00"
                  )}
                </p>
                <p className="text-xs text-green-300">Current level deposit</p>
              </div>
            </div>

            {/* Total Available for Withdrawal - Premium Design */}
            <div className="bg-gradient-to-r from-yellow-400/25 via-orange-400/20 to-red-400/15 border-2 border-yellow-300/40 rounded-xl p-5 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-yellow-200" />
                    <p className="text-yellow-100 text-base font-semibold">
                      Total Available for Withdrawal
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-200 mb-2">
                    PKR{" "}
                    {(
                      (earningsData?.data?.wallet?.mainWallet || 0) +
                      (earningsData?.data?.wallet?.commissionWallet || 0) +
                      (earningsData?.data?.security?.totalRefunds || 0)
                    )?.toFixed(2) || "0.00"}
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-yellow-200/90">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>
                        Main Wallet: PKR{" "}
                        {earningsData?.data?.wallet?.mainWallet?.toFixed(2) ||
                          "0.00"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-yellow-200/90">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>
                        Commission: PKR{" "}
                        {earningsData?.data?.wallet?.commissionWallet?.toFixed(
                          2,
                        ) || "0.00"}
                      </span>
                    </div>
                    {(earningsData?.data?.security?.totalRefunds || 0) > 0 && (
                      <div className="flex items-center gap-2 text-xs text-emerald-300">
                        <Shield className="w-3 h-3" />
                        <span>
                          Security Refund: PKR{" "}
                          {earningsData?.data?.security?.totalRefunds?.toFixed(
                            2,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-xs text-yellow-200 font-medium">
                    Ready to Withdraw
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Earning Table - As per requirements */}
      <div className="mx-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Total Earning
            </CardTitle>
            <CardDescription>
              Comprehensive breakdown of all earnings, commissions, and refunds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commissionBreakdown.map((commission, index) => (
                <div
                  key={commission.type}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-200 border border-gray-100 hover:border-gray-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 ${commission.bgColor} rounded-xl flex items-center justify-center shadow-sm border border-white/50`}
                    >
                      <commission.icon
                        className={`w-6 h-6 ${commission.color}`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-base">
                        {commission.type}
                      </p>
                      {commission.type === "Referral Invite Commission" && (
                        <p className="text-sm text-gray-600 mt-1">
                          💰 10% → 3% → 1% (multi-level invite bonus)
                        </p>
                      )}
                      {commission.type === "Referral Task Commission" && (
                        <p className="text-sm text-gray-600 mt-1">
                          📈 8% → 3% → 1% (task completion bonus)
                        </p>
                      )}
                      {commission.type === "Daily Task Commission" && (
                        <p className="text-sm text-gray-600 mt-1">
                          🎯 Earnings from completing daily video tasks
                        </p>
                      )}
                      {commission.type === "USDT Top-up Bonus (3%)" && (
                        <p className="text-sm text-gray-600 mt-1">
                          ⚡ Extra 3% bonus on USDT TRC20 top-ups
                        </p>
                      )}
                      {commission.type === "Special Commission" && (
                        <p className="text-sm text-gray-600 mt-1">
                          ⭐ Special promotions & blessed bonuses
                        </p>
                      )}
                      {commission.type === "Security Refund" && (
                        <p className="text-sm text-gray-600 mt-1">
                          🛡️ Refunds from previous level security deposits
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-gray-900">
                      PKR{" "}
                      {commission.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {commission.amount > 0 && (
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">
                          Earned
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Total Earning Summary - Enhanced */}
              <div className="border-t-2 border-gradient-to-r from-blue-200 via-purple-200 to-blue-200 pt-6 mt-8">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-gray-900 mb-1">
                        Total Earning
                      </p>
                      <p className="text-sm text-gray-600">
                        📊 All commission types combined from your activities
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">
                            Actively earning
                          </span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs text-blue-600 font-medium">
                          Updated in real-time
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      PKR{" "}
                      {earningsData?.data?.breakdown?.totalEarning?.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      ) || "0.00"}
                    </p>
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full mt-2">
                      <span className="text-xs font-medium">
                        Total Commissions
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Refund Section - Enhanced */}
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-900">
                        Security Refund
                      </p>
                      <p className="text-sm text-gray-600">
                        {(earningsData?.data?.security?.totalRefunds || 0) > 0
                          ? "Approved refunds from previous level upgrades"
                          : "No refunds available yet - upgrade your level to unlock"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-green-600">
                      PKR{" "}
                      {(
                        earningsData?.data?.security?.totalRefunds || 0
                      )?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {(earningsData?.data?.security?.totalRefunds || 0) ===
                      0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Available after level upgrade
                      </p>
                    )}
                  </div>
                </div>
                {(earningsData?.data?.security?.totalRefunds || 0) > 0 && (
                  <div className="mt-3 p-2 bg-white/60 rounded border-l-4 border-green-400">
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">
                        Security deposits from{" "}
                        {earningsData?.data?.security?.refundHistory?.length ||
                          "previous"}{" "}
                        level upgrade(s) refunded
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Final Total Available for Withdrawal - Enhanced */}
              <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white rounded-lg p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-6 h-6" />
                      <p className="font-bold text-xl">
                        Total Amount Available for Withdrawal
                      </p>
                    </div>
                    <div className="space-y-1 text-sm text-yellow-100">
                      <div className="flex items-center justify-between">
                        <span>💰 Total Earnings:</span>
                        <span className="font-medium">
                          PKR{" "}
                          {(
                            earningsData?.data?.breakdown?.totalEarning || 0
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>🛡️ Security Refunds:</span>
                        <span className="font-medium">
                          PKR{" "}
                          {(
                            earningsData?.data?.security?.totalRefunds || 0
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="border-t border-yellow-300/30 pt-1 mt-2">
                        <div className="flex items-center justify-between font-semibold">
                          <span>📊 Grand Total:</span>
                          <span className="text-lg">
                            PKR{" "}
                            {(
                              (earningsData?.data?.breakdown?.totalEarning ||
                                0) +
                              (earningsData?.data?.security?.totalRefunds || 0)
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-3xl mb-2">
                      PKR{" "}
                      {(
                        (earningsData?.data?.breakdown?.totalEarning || 0) +
                        (earningsData?.data?.security?.totalRefunds || 0)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <div className="bg-white/20 px-3 py-1 rounded-full">
                      <span className="text-xs font-medium">
                        Ready to withdraw
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Earnings Overview - Enhanced */}
      <div className="mx-4 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Recent Earnings
              </h3>
              <p className="text-sm text-gray-600">
                Your latest earning activities
              </p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1">
            Live Updates
          </Badge>
        </div>

        {/* Regular earnings - 2 columns Enhanced */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {earningsItems.map((earning, index) => {
            const IconComponent = earning.icon;

            return (
              <div
                key={earning.type}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-gray-200 relative overflow-hidden"
              >
                {/* Background decoration */}
                <div
                  className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${earning.gradient} opacity-10 rounded-full -translate-y-6 translate-x-6`}
                ></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${earning.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-medium leading-tight">
                        {earning.type}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-3">
                    PKR{" "}
                    {earning.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-emerald-600">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span>Last 24h</span>
                    </div>
                    {earning.amount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-emerald-200 text-emerald-700"
                      >
                        +{((earning.amount / 1000) * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Section - Updated with Security Refund */}
      <div className="mx-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Quick Actions
        </h3>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden pb-3 mb-10">
          {userNavigationBar.map((item, index) => (
            <Link key={index} href={item.href}>
              <div
                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  index !== userNavigationBar.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      item.label === "Support"
                        ? "bg-purple-100"
                        : item.label === "Security Refund"
                          ? "bg-green-100"
                          : "bg-blue-100"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 ${
                        item.label === "Support"
                          ? "text-purple-600"
                          : item.label === "Security Refund"
                            ? "text-green-600"
                            : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 font-medium">
                      {item.label}
                    </span>
                    {item.label === "Security Refund" && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-0.5">
                          NEW
                        </Badge>
                        {(earningsData?.data?.security?.totalRefunds || 0) >
                          0 && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-0.5">
                            PKR{" "}
                            {(
                              earningsData?.data?.security?.totalRefunds || 0
                            ).toFixed(0)}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default UserOverview;
