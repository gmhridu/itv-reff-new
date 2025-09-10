"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, History, Plus, TrendingUp } from "lucide-react";
import { TopupWalletManagement } from "@/components/topup/TopupWalletManagement";
import { TopupHistory } from "@/components/topup/TopupHistory";

export default function TopupManagementPage() {
  const [activeTab, setActiveTab] = useState("wallets");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Topup Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage admin wallets and monitor topup requests
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <TrendingUp className="w-4 h-4" />
          <span>Admin Dashboard</span>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Topup Management System</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="wallets"
                className="flex items-center gap-2 text-sm sm:text-base"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Topup</span> Wallets
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-2 text-sm sm:text-base"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Topup</span> History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallets" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Admin Wallet Management
                  </h2>
                </div>
                <p className="text-gray-600 text-sm mb-6">
                  Add and manage admin wallets that users can select for topup
                  requests. Users will see these wallets and can send money to
                  them for account topup.
                </p>
                <TopupWalletManagement />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Topup Request History
                  </h2>
                </div>
                <p className="text-gray-600 text-sm mb-6">
                  Monitor and process user topup requests. Review payment
                  proofs, approve or reject requests, and manage user wallet
                  balance updates.
                </p>
                <TopupHistory />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
