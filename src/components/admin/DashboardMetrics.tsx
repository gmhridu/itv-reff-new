"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

function MetricCard({ title, value, change, isPositive }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change} from last month
        </p>
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  revenue: number;
  revenueGrowth: number;
  totalUsers: number;
  usersGrowth: number;
  videoViews: number;
  videoViewsGrowth: number;
  activeUsers: number;
  activeUsersChange: number;
}

export default function DashboardMetrics({
  revenue,
  revenueGrowth,
  totalUsers,
  usersGrowth,
  videoViews,
  videoViewsGrowth,
  activeUsers,
  activeUsersChange
}: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Revenue"
        value={`$${revenue.toLocaleString()}`}
        change={`+${revenueGrowth}%`}
        isPositive={revenueGrowth > 0}
      />
      <MetricCard
        title="Total Users"
        value={`+${totalUsers.toLocaleString()}`}
        change={`+${usersGrowth}%`}
        isPositive={usersGrowth > 0}
      />
      <MetricCard
        title="Video Views"
        value={`+${videoViews.toLocaleString()}`}
        change={`+${videoViewsGrowth}%`}
        isPositive={videoViewsGrowth > 0}
      />
      <MetricCard
        title="Active Now"
        value={`+${activeUsers}`}
        change={`+${activeUsersChange} since last hour`}
        isPositive={activeUsersChange > 0}
      />
    </div>
  );
}