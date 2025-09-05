import React, { Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  NotebookPen,
  Share,
  User,
  Wallet,
  WalletMinimal,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Gift,
  Eye,
  Settings,
  Copy,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface UserNavigationBarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
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
    icon: WalletMinimal,
    label: "Daily Statement",
    href: "/user/daily-report",
  },
  {
    icon: Share,
    label: "Invite friends",
    href: "/user/invite",
  },
  {
    icon: Wallet,
    label: "Financial Records",
    href: "/user/financial-records",
  },
];

const UserOverview = () => {
  const regularEarnings = [
    {
      type: "Yesterday's earnings",
      amount: 620,
    },
    {
      type: "Today's earnings",
      amount: 0.0,
    },
    {
      type: "This month's earnings",
      amount: 14300,
    },
    {
      type: "This week's earnings",
      amount: 4340,
    },
  ];

  const specialEarnings = [
    {
      type: "Total revenue",
      amount: 14300,
    },
    {
      type: "Subordinate task commission",
      amount: 0.0,
    },
    {
      type: "Referral rebate",
      amount: 0.0,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg pb-4">
        <div className="flex items-center justify-between p-6">
          {/* Left side - Settings */}
          <div className="flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* Center - Avatar and User Info */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white/30 shadow-lg">
                <AvatarImage src="avatar.jpg" />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                  UN
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <h2 className="text-lg font-semibold text-white">
                  03454001749...
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-white hover:bg-white/20"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-blue-100 text-sm mt-1">Premium Member</p>
            </div>
          </div>

          {/* Right side - Notifications */}
          <div className="flex-1 flex items-center justify-end">
            <Link href={"/user/wallet"}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 relative cursor-pointer"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>My Wallet</p>
                </TooltipContent>
              </Tooltip>
            </Link>
          </div>
        </div>
      </div>

      {/* Wallet Balance Section */}
      <div className="mx-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              My Wallets
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Main Wallet</p>
                    <p className="text-2xl font-bold text-gray-900">PKR 0</p>
                  </div>
                </div>
                {/* <Button variant="outline" size="sm" className="text-gray-600">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Deposit
                </Button> */}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 mb-1">
                      Commission Wallet
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      PKR 14,300
                    </p>
                  </div>
                </div>
                <Link href={"/withdraw"}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Withdraw
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Overview */}
      <div className="mx-4 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-gray-800">Earnings Overview</h3>
        </div>

        {/* Regular earnings - 2 columns */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {regularEarnings.map((earning, index) => {
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
                  PKR {earning.amount.toLocaleString()}
                </p>
                <div className="mt-2 flex items-center text-xs text-emerald-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+12.5%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Special earnings - Enhanced cards */}
        <div className="space-y-3">
          {specialEarnings.map((earning, index) => {
            const gradients = [
              "from-yellow-400 to-orange-500",
              "from-green-400 to-emerald-500",
              "from-blue-400 to-purple-500",
            ];
            const icons = [DollarSign, Users, Gift];
            const IconComponent = icons[index];

            return (
              <div
                key={earning.type}
                className={`bg-gradient-to-r ${gradients[index]} rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/90 mb-1 leading-tight">
                        {earning.type}
                      </p>
                      <p className="text-xl font-bold text-white">
                        PKR {earning.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/80" />
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
