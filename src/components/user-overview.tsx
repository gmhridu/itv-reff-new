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
import { useRouter } from "next/navigation";

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
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
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
];

const UserOverview = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    Promise.all([fetchWalletData(), fetchEarningsData(), fetchUserProfile()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await fetch("/api/wallet/balance");
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    }
  };

  const fetchEarningsData = async () => {
    try {
      const response = await fetch("/api/user/earnings");
      if (response.ok) {
        const data = await response.json();
        setEarningsData(data);
      }
    } catch (error) {
      console.error("Error fetching earnings data:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Get initials for avatar
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return 'UN';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 3);
  };

  const earningsItems = [
    {
      type: "Yesterday's earnings",
      amount: earningsData?.yesterday || 0,
    },
    {
      type: "Today's earnings",
      amount: earningsData?.today || 0,
    },
    {
      type: "This month's earnings",
      amount: earningsData?.thisMonth || 0,
    },
    {
      type: "This week's earnings",
      amount: earningsData?.thisWeek || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg pb-4">
        <div className="flex items-center justify-center p-6">
          <div className="flex flex-col items-center justify-center gap-3">
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
                  {userProfile?.name || 'User'}
                </h2>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/20 px-3 py-1 rounded-full mt-1">
                <span className="text-blue-100 text-sm">
                  {userProfile ? formatPhoneNumber(userProfile.phone) : '****'}
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
        </div>
      </div>

      {/* Wallet Balance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Overview
          </CardTitle>
          <CardDescription>
            Manage your earnings and view transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Balance
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  PKR {walletData?.balance.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available for withdrawal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  PKR {walletData?.totalEarnings.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">Since joining</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Overview */}
      <div className="mx-4 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-gray-800">Earnings Overview</h3>
        </div>

        {/* Regular earnings - 2 columns */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {earningsItems.map((earning, index) => {
            const gradients = [
              "from-emerald-500 to-teal-600",
              "from-blue-500 to-indigo-600",
              "from-purple-500 to-pink-600",
              "from-orange-500 to-red-600",
            ];
            const icons = [Calendar, TrendingUp, Calendar, Calendar];
            const IconComponent = icons[index];

            return (
              <div
                key={earning.type}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${gradients[index]} rounded-full flex items-center justify-center`}
                  >
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium leading-tight">
                    {earning.type}
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  PKR {earning.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="mt-2 flex items-center text-xs text-emerald-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+12.5%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Section */}
      <div className="mx-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Quick Actions
        </h3>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <item.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-gray-800 font-medium">
                    {item.label}
                  </span>
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
