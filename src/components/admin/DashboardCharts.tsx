"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, Bar, BarChart, XAxis, YAxis } from "recharts";

interface ChartDataPoint {
  name: string;
  value: number;
}

interface DashboardChartsProps {
  userIncomeData: ChartDataPoint[];
  videoViewsData: ChartDataPoint[];
}

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
};

export default function DashboardCharts({ userIncomeData, videoViewsData }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>User Income</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[300px]">
            <LineChart data={userIncomeData}>
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={{ fill: "var(--color-chart-1)" }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Video Views</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[300px]">
            <BarChart data={videoViewsData}>
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-chart-2)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}