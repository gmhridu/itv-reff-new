import { AnalyticsClient } from "@/components/admin/AnalyticsClient";
import { PlatformPerformanceDashboard } from "@/components/admin/PlatformPerformanceDashboard";
import { analyticsService } from "@/lib/admin/analytics-service";
import { AnalyticsData } from "@/types/admin";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Loading component for analytics
function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[80px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Error component for analytics
function AnalyticsError({ error }: { error: string }) {
  return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Failed to load analytics
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </CardContent>
    </Card>
  );
}

async function getAnalyticsData(): Promise<{
  data: AnalyticsData;
  error?: string;
}> {
  try {
    console.log("Analytics Page: Fetching initial analytics data...");

    // Get analytics data from the service
    const data = await analyticsService.getAnalyticsData(
      undefined, // dateFrom - will use default
      undefined, // dateTo - will use default
      "monthly", // timePeriod
    );

    console.log("Analytics Page: Successfully fetched initial data", {
      totalRevenue: data.overview.totalRevenue,
      totalUsers: data.overview.totalUsers,
      totalVideoViews: data.overview.totalVideoViews,
    });

    return { data };
  } catch (error) {
    console.error("Analytics Page: Error fetching analytics data:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Return empty data structure with error
    return {
      data: {
        overview: {
          totalRevenue: 0,
          revenueGrowth: 0,
          totalUsers: 0,
          userGrowth: 0,
          totalVideoViews: 0,
          videoViewGrowth: 0,
          activeUsers: 0,
          activeUserChange: 0,
        },
        userIncome: {
          monthly: [],
          weekly: [],
          yearly: [],
        },
        videoViews: {
          daily: [],
          weekly: [],
          monthly: [],
        },
        topVideos: [],
        topUsers: [],
        revenueBreakdown: [],
      },
      error: errorMessage,
    };
  }
}

// Analytics content component
async function AnalyticsContent() {
  const { data: initialData, error } = await getAnalyticsData();

  if (error) {
    return <AnalyticsError error={error} />;
  }

  return (
    <Tabs defaultValue="performance" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="performance">Platform Performance</TabsTrigger>
        <TabsTrigger value="detailed">Detailed Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="performance">
        <PlatformPerformanceDashboard initialData={initialData} />
      </TabsContent>

      <TabsContent value="detailed">
        <AnalyticsClient initialData={initialData} />
      </TabsContent>
    </Tabs>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsContent />
    </Suspense>
  );
}
