'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target, 
  Users,
  MousePointer,
  UserPlus,
  Award,
  Calendar,
  Trophy,
  Activity,
  Zap
} from 'lucide-react';

interface ConversionFunnel {
  clicks: number;
  registrations: number;
  qualifications: number;
  rewards: number;
}

interface ConversionRates {
  clickToRegistration: number;
  registrationToQualification: number;
  qualificationToReward: number;
  overallConversion: number;
}

interface DailyAnalytics {
  date: string;
  clicks: number;
  registrations: number;
  earnings: number;
}

interface WeeklyGrowth {
  week: string;
  startDate: string;
  aLevel: number;
  bLevel: number;
  cLevel: number;
  total: number;
}

interface PerformanceMetrics {
  averageDailyClicks: number;
  averageDailyRegistrations: number;
  averageDailyEarnings: number;
  bestPerformingDay: {
    date: string;
    earnings: number;
  };
  totalPeriodEarnings: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  totalEarnings: number;
  isCurrentUser: boolean;
}

interface AnalyticsData {
  conversionFunnel: ConversionFunnel;
  conversionRates: ConversionRates;
  dailyAnalytics: DailyAnalytics[];
  weeklyGrowth: WeeklyGrowth[];
  trafficSources: Record<string, number>;
  performanceMetrics: PerformanceMetrics;
  leaderboard: {
    userPosition: number;
    totalUsers: number;
    topPerformers: LeaderboardEntry[];
  };
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/referrals/analytics?period=${period}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAnalyticsData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Start your referral activities to see analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold">{analyticsData.conversionFunnel.clicks}</p>
                <p className="text-xs text-gray-500">Avg: {analyticsData.performanceMetrics.averageDailyClicks.toFixed(1)}/day</p>
              </div>
              <MousePointer className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registrations</p>
                <p className="text-2xl font-bold text-green-600">{analyticsData.conversionFunnel.registrations}</p>
                <p className="text-xs text-gray-500">Avg: {analyticsData.performanceMetrics.averageDailyRegistrations.toFixed(1)}/day</p>
              </div>
              <UserPlus className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{analyticsData.conversionRates.overallConversion.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Click to reward</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Period Earnings</p>
                <p className="text-2xl font-bold text-orange-600">₹{analyticsData.performanceMetrics.totalPeriodEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Avg: ₹{analyticsData.performanceMetrics.averageDailyEarnings.toFixed(2)}/day</p>
              </div>
              <Award className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Conversion Funnel
          </CardTitle>
          <CardDescription>
            Track how your referral traffic converts through each stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-3">
                <MousePointer className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold">Clicks</p>
                  <p className="text-sm text-gray-600">People who clicked your referral link</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{analyticsData.conversionFunnel.clicks}</p>
                <p className="text-sm text-gray-500">100%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold">Registrations</p>
                  <p className="text-sm text-gray-600">People who completed registration</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{analyticsData.conversionFunnel.registrations}</p>
                <p className="text-sm text-gray-500">{analyticsData.conversionRates.clickToRegistration.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-semibold">Qualifications</p>
                  <p className="text-sm text-gray-600">People who completed qualifying actions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-600">{analyticsData.conversionFunnel.qualifications}</p>
                <p className="text-sm text-gray-500">{analyticsData.conversionRates.registrationToQualification.toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="font-semibold">Rewards</p>
                  <p className="text-sm text-gray-600">People who generated rewards for you</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">{analyticsData.conversionFunnel.rewards}</p>
                <p className="text-sm text-gray-500">{analyticsData.conversionRates.qualificationToReward.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Performance
          </CardTitle>
          <CardDescription>
            Your daily referral activity and earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.dailyAnalytics.slice(-7).map((day, index) => (
              <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p className="text-sm text-gray-600">
                      {day.clicks} clicks • {day.registrations} registrations
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{day.earnings.toFixed(2)}</p>
                  {day.date === analyticsData.performanceMetrics.bestPerformingDay.date && (
                    <Badge className="bg-yellow-100 text-yellow-800">Best Day</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traffic Sources & Team Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>
              Where your referral clicks are coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analyticsData.trafficSources).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="capitalize">{source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{count}</span>
                    <span className="text-sm text-gray-500">
                      ({((count / analyticsData.conversionFunnel.clicks) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Team Growth</CardTitle>
            <CardDescription>
              New team members added each week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.weeklyGrowth.slice(-4).map((week) => (
                <div key={week.week} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{week.week}</p>
                    <p className="text-sm text-gray-600">
                      A:{week.aLevel} • B:{week.bLevel} • C:{week.cLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{week.total}</p>
                    <p className="text-sm text-gray-500">new members</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
          <CardDescription>
            Your ranking among all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Position</p>
                <p className="text-2xl font-bold text-blue-600">#{analyticsData.leaderboard.userPosition}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Out of {analyticsData.leaderboard.totalUsers} users</p>
                <p className="text-sm text-blue-600">
                  Top {((analyticsData.leaderboard.userPosition / analyticsData.leaderboard.totalUsers) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {analyticsData.leaderboard.topPerformers.slice(0, 5).map((performer) => (
              <div 
                key={performer.rank} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  performer.isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    performer.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {performer.rank <= 3 ? <Trophy className="w-4 h-4" /> : `#${performer.rank}`}
                  </div>
                  <div>
                    <p className={`font-medium ${performer.isCurrentUser ? 'text-blue-600' : ''}`}>
                      {performer.name} {performer.isCurrentUser && '(You)'}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-green-600">₹{performer.totalEarnings.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
