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

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalReferralEarnings: number;
  monthlyReferrals: number;
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
    earnings: number;
    balance: number;
    joinedAt: string;
    isActive: boolean;
  }>;
}

export default function ReferralClient() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(
    null,
  );
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
        setReferralStats(data);
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
          title: "Join VideoTask Rewards",
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
            Invite friends and earn PKR 5 for each person who joins and starts
            watching videos. There's no limit to how much you can earn!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Total Referrals
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-gray-800">
                {referralStats?.totalReferrals || 0}
              </div>
              <p className="text-xs text-gray-500">
                {referralStats?.monthlyReferrals || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Active Referrals
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-gray-800">
                {referralStats?.activeReferrals || 0}
              </div>
              <p className="text-xs text-gray-500">Earning rewards</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Referral Earnings
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-gray-800">
                PKR {referralStats?.totalReferralEarnings.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500">Total earned</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Bonus per Referral
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-gray-800">
                PKR 5.00
              </div>
              <p className="text-xs text-gray-500">When they start earning</p>
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
        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200">
            <TabsTrigger
              value="referrals"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-700"
            >
              <span className="hidden sm:inline">My Referrals</span>
              <span className="sm:hidden">Referrals</span>
            </TabsTrigger>
            <TabsTrigger
              value="top-performers"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-700"
            >
              <span className="hidden sm:inline">Top Performers</span>
              <span className="sm:hidden">Top</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-800 text-lg sm:text-xl">
                  Referred Users
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Users who joined using your referral code
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
                              <span className="text-xs text-gray-500">
                                Joined{" "}
                                {new Date(
                                  referral.joinedAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right sm:text-center flex-shrink-0">
                          <p className="font-semibold text-emerald-600 text-sm sm:text-base">
                            PKR {referral.earnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">Earned</p>
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

          <TabsContent value="top-performers" className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 text-lg sm:text-xl">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                  </div>
                  Top Performing Referrals
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Your most successful referrals based on their earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralStats?.topReferrals &&
                referralStats.topReferrals.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {referralStats.topReferrals.map((referral, index) => (
                      <div
                        key={referral.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-emerald-200 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                            #{index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                              {referral.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Joined{" "}
                              {new Date(referral.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right sm:text-center flex-shrink-0">
                          <p className="font-semibold text-emerald-600 text-sm sm:text-base">
                            PKR {referral.earnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Total Earnings
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-700">
                      No top performers yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Your top referrals will appear here once they start
                      earning.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* How It Works */}
        <Card className="mt-6 sm:mt-8 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800 text-lg sm:text-xl">
              How Referral Program Works
            </CardTitle>
            <CardDescription className="text-gray-600">
              Simple steps to start earning referral bonuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Share2 className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-800 text-sm sm:text-base">
                  Share Your Link
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Copy your unique referral link and share it with friends
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-800 text-sm sm:text-base">
                  Friends Join
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Your friends sign up using your referral link
                </p>
              </div>
              <div className="text-center sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-800 text-sm sm:text-base">
                  Earn Bonus
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Get PKR 5 when your friend starts watching videos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
