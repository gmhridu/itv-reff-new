'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Award, 
  Calendar,
  Crown,
  Star,
  Users,
  Target,
  Gift,
  BarChart3
} from 'lucide-react';

interface RewardHistory {
  id: string;
  tier: string;
  amount: number;
  description: string;
  createdAt: string;
  referredUserPosition: string;
  referrerPosition: string;
}

interface ManagementBonus {
  id: string;
  amount: number;
  level: string;
  taskIncome: number;
  subordinate: string;
  createdAt: string;
}

interface MonthlyBreakdown {
  month: string;
  referralRewards: number;
  managementBonuses: number;
  total: number;
}

interface RewardsData {
  rewardHistory: RewardHistory[];
  managementBonuses: ManagementBonus[];
  totalRewards: {
    aLevel: number;
    bLevel: number;
    cLevel: number;
    total: number;
  };
  totalCounts: {
    aLevel: number;
    bLevel: number;
    cLevel: number;
    total: number;
  };
  totalManagementBonuses: {
    aLevel: number;
    bLevel: number;
    cLevel: number;
    total: number;
  };
  monthlyBreakdown: MonthlyBreakdown[];
}

export default function RewardsTracking() {
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const fetchRewardsData = async () => {
    try {
      const response = await fetch('/api/referrals/rewards');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRewardsData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'a':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'b':
        return <Star className="w-4 h-4 text-blue-500" />;
      case 'c':
        return <Users className="w-4 h-4 text-green-500" />;
      default:
        return <Award className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'a':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'b':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'c':
        return 'bg-green-50 text-green-800 border-green-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!rewardsData) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rewards Data</h3>
        <p className="text-gray-600">Start referring people to earn rewards and see tracking here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rewards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rewards</p>
                <p className="text-2xl font-bold text-green-600">PKR {rewardsData.totalRewards.total.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Management Bonuses</p>
                <p className="text-2xl font-bold text-blue-600">PKR {rewardsData.totalManagementBonuses.total.toFixed(2)}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{rewardsData.totalCounts.total}</p>
              </div>
              <Gift className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-orange-600">
                  PKR {(rewardsData.monthlyBreakdown[rewardsData.monthlyBreakdown.length - 1]?.total || 0).toFixed(2)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Breakdown by Tier */}
      <Card>
        <CardHeader>
          <CardTitle>Rewards Breakdown by Tier</CardTitle>
          <CardDescription>
            Your earnings from each referral level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold">A-Level Rewards</h3>
              </div>
              <p className="text-2xl font-bold text-yellow-600">PKR {rewardsData.totalRewards.aLevel.toFixed(2)}</p>
              <p className="text-sm text-gray-600">{rewardsData.totalCounts.aLevel} transactions</p>
              <p className="text-xs text-gray-500 mt-1">Direct referrals (6% bonus rate)</p>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">B-Level Rewards</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">PKR {rewardsData.totalRewards.bLevel.toFixed(2)}</p>
              <p className="text-sm text-gray-600">{rewardsData.totalCounts.bLevel} transactions</p>
              <p className="text-xs text-gray-500 mt-1">2nd generation (3% bonus rate)</p>
            </div>

            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">C-Level Rewards</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">PKR {rewardsData.totalRewards.cLevel.toFixed(2)}</p>
              <p className="text-sm text-gray-600">{rewardsData.totalCounts.cLevel} transactions</p>
              <p className="text-xs text-gray-500 mt-1">3rd generation (1% bonus rate)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Monthly Earnings Trend
          </CardTitle>
          <CardDescription>
            Your earnings over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rewardsData.monthlyBreakdown.map((month, index) => (
              <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{month.month}</p>
                    <p className="text-sm text-gray-600">
                      Referral: PKR {month.referralRewards.toFixed(2)} | 
                      Bonus: PKR {month.managementBonuses.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">PKR {month.total.toFixed(2)}</p>
                  {index > 0 && (
                    <p className="text-sm text-gray-500">
                      {month.total > rewardsData.monthlyBreakdown[index - 1].total ? (
                        <span className="text-green-600">↗ Growth</span>
                      ) : month.total < rewardsData.monthlyBreakdown[index - 1].total ? (
                        <span className="text-red-600">↘ Decline</span>
                      ) : (
                        <span className="text-gray-600">→ Same</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Transaction History */}
      <Tabs defaultValue="referral-rewards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referral-rewards">Referral Rewards</TabsTrigger>
          <TabsTrigger value="management-bonuses">Management Bonuses</TabsTrigger>
        </TabsList>

        <TabsContent value="referral-rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referral Reward History</CardTitle>
              <CardDescription>
                Rewards earned from position upgrades in your network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rewardsData.rewardHistory.slice(0, 10).map((reward) => (
                  <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTierIcon(reward.tier)}
                      <div>
                        <p className="font-medium">{reward.description}</p>
                        <p className="text-sm text-gray-600">
                          {reward.referredUserPosition} → Tier {reward.tier.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+PKR {reward.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(reward.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {rewardsData.rewardHistory.length === 0 && (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No referral rewards yet. Start referring people to earn rewards!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management-bonuses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Management Bonus History</CardTitle>
              <CardDescription>
                Daily bonuses from your team's task completions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rewardsData.managementBonuses.slice(0, 10).map((bonus) => (
                  <div key={bonus.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTierIcon(bonus.level.split('_')[0])}
                      <div>
                        <p className="font-medium">{bonus.subordinate}</p>
                        <p className="text-sm text-gray-600">
                          {bonus.level} bonus from PKR {bonus.taskIncome} task income
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">+PKR {bonus.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(bonus.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {rewardsData.managementBonuses.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No management bonuses yet. Your team needs to complete tasks to earn bonuses!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
