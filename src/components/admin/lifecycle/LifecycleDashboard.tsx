"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw, Download, Users, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LifecycleDashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    churnRate: number;
    averageEngagementScore: number;
    lifetimeValueTotal: number;
  };
  stageDistribution: Record<string, number>;
  segmentDistribution: Record<string, number>;
  journeyMetrics: {
    averageTimeToFirstTask: number;
    averageTimeToFirstEarning: number;
    averageTimeToFirstReferral: number;
    conversionRate: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    engagementTrend: Array<{ date: string; score: number }>;
    churnTrend: Array<{ date: string; rate: number }>;
  };
  topSegments: Array<{
    segment: string;
    userCount: number;
    growthRate: number;
    averageLTV: number;
  }>;
}

interface LifecycleInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  recommendation: string;
  data: Record<string, any>;
}

const LifecycleDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<LifecycleDashboardMetrics | null>(null);
  const [insights, setInsights] = useState<LifecycleInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchLifecycleData();
  }, [dateRange]);

  const fetchLifecycleData = async () => {
    try {
      setLoading(true);

      const [metricsResponse, insightsResponse] = await Promise.all([
        fetch(`/api/admin/lifecycle/analytics?type=dashboard&dateFrom=${dateRange.from.toISOString()}&dateTo=${dateRange.to.toISOString()}`),
        fetch(`/api/admin/lifecycle/analytics?type=insights&dateFrom=${dateRange.from.toISOString()}&dateTo=${dateRange.to.toISOString()}`)
      ]);

      if (metricsResponse.ok && insightsResponse.ok) {
        const metricsData = await metricsResponse.json();
        const insightsData = await insightsResponse.json();

        setMetrics(metricsData.data);
        setInsights(insightsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch lifecycle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    let from: Date;

    switch (period) {
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setDateRange({ from, to: now });
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/admin/lifecycle/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'comprehensive',
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
          exportFormat: 'csv'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `lifecycle-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading lifecycle data...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Failed to load lifecycle data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Lifecycle Dashboard</h1>
          <p className="text-gray-600">Track user journey and engagement metrics</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchLifecycleData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overview.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatNumber(metrics.overview.newUsersToday)} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.overview.activeUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(metrics.overview.activeUsers / metrics.overview.totalUsers)} of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.overview.churnRate)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.overview.churnRate > 0.2 ? 'Above threshold' : 'Within target'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overview.averageEngagementScore}/100</div>
            <p className="text-xs text-muted-foreground">
              {metrics.overview.averageEngagementScore >= 70 ? 'Good' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stages">User Stages</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="journey">User Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Journey Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Journey Metrics</CardTitle>
                <CardDescription>Average time to key milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>First Task Completion</span>
                  <span className="font-semibold">{metrics.journeyMetrics.averageTimeToFirstTask.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span>First Earning</span>
                  <span className="font-semibold">{metrics.journeyMetrics.averageTimeToFirstEarning.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span>First Referral</span>
                  <span className="font-semibold">{metrics.journeyMetrics.averageTimeToFirstReferral.toFixed(1)} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Overall Conversion</span>
                  <span className="font-semibold">{formatPercentage(metrics.journeyMetrics.conversionRate)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Segments</CardTitle>
                <CardDescription>Highest value user segments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.topSegments.slice(0, 5).map((segment, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{segment.segment.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500">{formatNumber(segment.userCount)} users</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(segment.averageLTV)}</div>
                        <div className="text-sm text-green-600">+{formatPercentage(segment.growthRate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Stage Distribution</CardTitle>
              <CardDescription>Current distribution across lifecycle stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(metrics.stageDistribution).map(([stage, count]) => (
                  <div key={stage} className="p-4 border rounded-lg">
                    <div className="font-medium">{stage.replace('_', ' ')}</div>
                    <div className="text-2xl font-bold text-blue-600">{formatNumber(count as number)}</div>
                    <div className="text-sm text-gray-500">
                      {formatPercentage((count as number) / metrics.overview.totalUsers)} of total
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Segments</CardTitle>
              <CardDescription>Behavioral segment distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(metrics.segmentDistribution).map(([segment, count]) => (
                  <div key={segment} className="p-4 border rounded-lg">
                    <div className="font-medium">{segment.replace('_', ' ')}</div>
                    <div className="text-2xl font-bold text-green-600">{formatNumber(count as number)}</div>
                    <div className="text-sm text-gray-500">
                      {formatPercentage((count as number) / metrics.overview.totalUsers)} of total
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            <div className="grid gap-4">
              {insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact} IMPACT
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">{insight.description}</p>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-blue-900">Recommendation:</p>
                      <p className="text-sm text-blue-800">{insight.recommendation}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                      <span>Category: {insight.category}</span>
                      <span>Confidence: {formatPercentage(insight.confidence)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No actionable insights available for this period.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Journey Analytics</CardTitle>
              <CardDescription>Coming soon - Interactive journey flow visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Journey flow visualization and funnel analysis will be available in the next update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LifecycleDashboard;
