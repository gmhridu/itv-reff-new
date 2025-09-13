"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { Button } from "./ui/button";

const transactionData = {
  recharge: [
    {
      id: "2025082102033124774131311",
      amount: "52000",
      date: "2025-08-21 02:03:31",
      status: "Pending payment",
    },
    {
      id: "2025082102031862466293756",
      amount: "52000",
      date: "2025-08-21 02:03:18",
      status: "Pending payment",
    },
    {
      id: "2025082102031154656503801",
      amount: "52000",
      date: "2025-08-21 02:03:11",
      status: "Pending payment",
    },
    {
      id: "2025082102001228341761621",
      amount: "52000",
      date: "2025-08-21 02:00:12",
      status: "Pending payment",
    },
    {
      id: "2025082101592793789817061",
      amount: "20000",
      date: "2025-08-21 01:59:27",
      status: "Pending payment",
    },
    {
      id: "2025082101592253152308041",
      amount: "20000",
      date: "2025-08-21 01:59:22",
      status: "Pending payment",
    },
    {
      id: "2025082101590383704842351",
      amount: "20000",
      date: "2025-08-21 01:59:03",
      status: "Pending payment",
    },
    {
      id: "2025082101581417436459421",
      amount: "20000",
      date: "2025-08-21 01:58:14",
      status: "Pending payment",
    },
  ],
  withdrawal: [],
};

const getStatusIcon = (status) => {
  switch (status) {
    case "Pending payment":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "Completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "Failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "Pending payment":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "Completed":
      return "text-green-600 bg-green-50 border-green-200";
    case "Failed":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export default function UserWalletOverview() {
  const [activeRecordTab, setActiveRecordTab] = useState("recharge");
  const router = useRouter();

  const redirectToWithdraw = () => {
    redirect("/withdraw");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Button
        variant={"outline"}
        size="sm"
        onClick={handleBack}
        className="mb-3 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            My Wallet
          </h2>
          <p className="text-gray-600 mt-1 text-sm">
            Manage your finances and track transactions
          </p>
        </div>

        {/* Wallet Balance Card */}
        <Card className="mb-6 shadow-xl border-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Main Wallet */}
              <div className="text-center md:text-left text-white">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                  <Wallet className="w-4 h-4" />
                  <p className="text-sm font-medium opacity-90">Main Wallet</p>
                </div>
                <p className="text-2xl font-bold">PKR 0.00</p>
                <div className="flex items-center gap-1 justify-center md:justify-start mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs opacity-75">Available Balance</span>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-16 bg-white/20"></div>
              <div className="md:hidden w-full h-px bg-white/20"></div>

              {/* Commission Wallet */}
              <div className="text-center md:text-right text-white">
                <div className="flex items-center gap-2 justify-center md:justify-end mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <p className="text-sm font-medium opacity-90">
                    Commission Wallet
                  </p>
                </div>
                <p className="text-2xl font-bold">PKR 14,300.00</p>
                <div className="flex items-center gap-1 justify-center md:justify-end mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs opacity-75">Total Earnings</span>
                </div>
              </div>
            </div>

            <Separator className="my-6 bg-white/20" />

            {/* Action Tabs */}
            <div className="flex items-center bg-white/10 rounded-xl p-1 backdrop-blur-sm cursor-pointer">
              <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-white text-indigo-600 shadow-lg cursor-pointer">
                <TrendingUp className="w-4 h-4" />
                Recharge
              </div>
              <div className="w-px h-6 bg-white/20 mx-2"></div>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
                onClick={redirectToWithdraw}
              >
                <TrendingDown className="w-4 h-4" />
                Withdrawal
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Records */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-0">
            {/* Tab Headers */}
            <div className="border-b bg-gray-50">
              <div className="flex">
                <button
                  onClick={() => setActiveRecordTab("recharge")}
                  className={`flex-1 text-center py-3 font-medium border-b-2 cursor-pointer transition-colors  ${
                    activeRecordTab === "recharge"
                      ? "text-indigo-600 border-indigo-600 bg-white"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  Recharge record
                </button>
                <button
                  onClick={() => setActiveRecordTab("withdrawal")}
                  className={`flex-1 text-center py-3 font-medium border-b-2 cursor-pointer transition-colors ${
                    activeRecordTab === "withdrawal"
                      ? "text-indigo-600 border-indigo-600 bg-white"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  Withdrawal record
                </button>
              </div>
            </div>

            {/* Transaction List */}
            <div className="p-4">
              {transactionData[activeRecordTab].length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-3">
                    <Wallet className="w-12 h-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-500">No data</p>
                  <p className="text-gray-400 text-sm mt-1">
                    No transactions found for this category
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactionData[activeRecordTab].map(
                    (transaction, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          {/* Left Side - Transaction ID and Amount */}
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 mb-1 font-mono">
                              {transaction.id}
                            </p>
                            <p className="text-lg font-bold text-indigo-600">
                              PKR {parseInt(transaction.amount).toLocaleString()}
                            </p>
                          </div>

                          {/* Right Side - Date and Status */}
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">
                              {transaction.date}
                            </p>
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                                transaction.status
                              )}`}
                            >
                              {getStatusIcon(transaction.status)}
                              {transaction.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
