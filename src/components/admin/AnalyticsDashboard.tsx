"use client"

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Calendar, Download, TrendingUp, Users, DollarSign, Eye } from 'lucide-react'
import { AnalyticsTimeRange } from '@/types/admin-enums'

interface AnalyticsDashboardProps {
  data: {
    userIncomeData: Array<{ month: string; income: number; users: number }>
    videoMetrics: {
      totalViews: number
      averageWatchTime: number
      engagementRate: number
      topVideos: Array<{ id: string; title: string; views: number; earnings: number }>
    }
    userGrowth: Array<{ date: string; newUsers: number; totalUsers: number }>
    revenueData: {
      totalRevenue: number
      monthlyRevenue: number
      revenueGrowth: number
      revenueBySource: Array<{ source: string; amount: number; percentage: number }>
    }
  }
  timeRange: AnalyticsTimeRange
  onTimeRangeChange: (range: AnalyticsTimeRange) => void
  onExportData?: () => void
}

const chartConfig = {
  income: {
    label: 'Income ($)',
    color: 'hsl(var(--chart-1))'
  },
  users: {
    label: 'Users',
    color: 'hsl(var(--chart-2))'
  },
  newUsers: {
    label: 'New Users',
    color: 'hsl(var(--chart-3))'
  },
  totalUsers: {
    label: 'Total Users',
    color: 'hsl(var(--chart-4))'
  }
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))']

export default function AnalyticsDashboard({
  data,
  timeRange,
  onTimeRangeChange,
  onExportData
}: AnalyticsDashboardProps) {
  const [selectedChart, setSelectedChart] = useState<'income' | 'growth' | 'revenue'>('income')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your platform performance and user engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value) => onTimeRangeChange(value as AnalyticsTimeRange)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
          {onExportData && (
            <Button variant="outline" onClick={onExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data.revenueData.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+{data.revenueData.revenueGrowth}%</span>
              <span className="text-sm text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(data.videoMetrics.totalViews)}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-muted-foreground">
                Avg. watch time: {data.videoMetrics.averageWatchTime}s
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{formatNumber(data.userGrowth[data.userGrowth.length - 1]?.totalUsers || 0)}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-muted-foreground">
                +{data.userGrowth[data.userGrowth.length - 1]?.newUsers || 0} new today
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                <p className="text-2xl font-bold">{data.videoMetrics.engagementRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-muted-foreground">
                Above average performance
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Income Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Income Tracking</CardTitle>
            <CardDescription>Monthly income and user growth trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="w-full h-[300px]">
              <BarChart data={data.userIncomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="income" fill="var(--color-income)" />
                <Bar dataKey="users" fill="var(--color-users)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Daily new user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="w-full h-[300px]">
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="newUsers" stroke="var(--color-newUsers)" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
            <CardDescription>Breakdown of revenue by source</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="w-full h-[300px]">
              <PieChart>
                <Pie
                  data={data.revenueData.revenueBySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {data.revenueData.revenueBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Videos</CardTitle>
            <CardDescription>Videos with highest engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.videoMetrics.topVideos.map((video, index) => (
                <div key={video.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{video.title}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(video.views)} views</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(video.earnings)}</p>
                    <p className="text-sm text-muted-foreground">earnings</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}