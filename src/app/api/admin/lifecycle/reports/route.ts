import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { userLifecycleService } from "@/lib/user-lifecycle";
import { UserLifecycleFilters } from "@/lib/user-lifecycle/types";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse date range parameters (required for reports)
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");

    if (!dateFromParam || !dateToParam) {
      return NextResponse.json(
        { error: "Date range is required (dateFrom and dateTo)" },
        { status: 400 },
      );
    }

    const dateFrom = new Date(dateFromParam);
    const dateTo = new Date(dateToParam);

    // Validate date range
    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    if (dateFrom >= dateTo) {
      return NextResponse.json(
        { error: "dateFrom must be before dateTo" },
        { status: 400 },
      );
    }

    // Parse optional filters
    const filters: UserLifecycleFilters = {};

    const segments = searchParams.get("segments");
    if (segments) {
      filters.segments = segments.split(",") as any[];
    }

    const stages = searchParams.get("stages");
    if (stages) {
      filters.stages = stages.split(",") as any[];
    }

    const journeyPhases = searchParams.get("journeyPhases");
    if (journeyPhases) {
      filters.journeyPhases = journeyPhases.split(",") as any[];
    }

    const positionLevels = searchParams.get("positionLevels");
    if (positionLevels) {
      filters.positionLevels = positionLevels.split(",");
    }

    const hasReferrals = searchParams.get("hasReferrals");
    if (hasReferrals !== null) {
      filters.hasReferrals = hasReferrals === "true";
    }

    // Parse report type
    const reportType = searchParams.get("type") || "comprehensive";
    const format = searchParams.get("format") || "json";

    console.log("Lifecycle report generation started", {
      reportType,
      format,
      dateRange: { from: dateFrom, to: dateTo },
      filtersApplied: Object.keys(filters).length,
      adminId: session.user?.id,
    });

    // Generate the report
    const report = await userLifecycleService.generateLifecycleReport(
      dateFrom,
      dateTo,
      filters,
    );

    // Handle different export formats
    if (format === "csv") {
      return await generateCSVReport(report, reportType);
    } else if (format === "xlsx") {
      return await generateExcelReport(report, reportType);
    }

    // Default JSON response
    return NextResponse.json({
      success: true,
      data: report,
      metadata: {
        reportType,
        format,
        generatedBy: session.user?.email,
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
        filters,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Lifecycle reports API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date(),
      },
      { status: 500 },
    );
  }
}

// POST endpoint for custom report generation
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      reportType,
      dateFrom,
      dateTo,
      filters,
      includeCharts,
      includeRawData,
      customMetrics,
      exportFormat,
    } = body;

    // Validate required parameters
    if (!reportType || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "Missing required parameters: reportType, dateFrom, dateTo" },
        { status: 400 },
      );
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    let report;

    switch (reportType) {
      case "comprehensive":
        report = await userLifecycleService.generateLifecycleReport(
          fromDate,
          toDate,
          filters || {},
        );
        break;

      case "segment_analysis":
        // Generate segment-focused report
        const segmentData = await userLifecycleService.getSegmentDistribution(
          filters || {},
        );

        report = {
          reportId: `segment_analysis_${Date.now()}`,
          reportType: "segment_analysis",
          generatedAt: new Date(),
          dateRange: { from: fromDate, to: toDate },
          data: {
            segmentDistribution: segmentData,
            // Add more segment-specific analytics
          },
        } as any;
        break;

      case "journey_funnel":
        // Generate journey funnel report
        report = {
          reportId: `journey_funnel_${Date.now()}`,
          reportType: "journey_funnel",
          generatedAt: new Date(),
          dateRange: { from: fromDate, to: toDate },
          data: {
            // Add journey funnel analytics
            funnelSteps: [],
            conversionRates: [],
            dropoffPoints: [],
          },
        } as any;
        break;

      case "churn_analysis":
        // Generate churn analysis report
        report = {
          reportId: `churn_analysis_${Date.now()}`,
          reportType: "churn_analysis",
          generatedAt: new Date(),
          dateRange: { from: fromDate, to: toDate },
          data: {
            // Add churn-specific analytics
            churnRate: 0,
            riskUsers: [],
            churnPredictions: [],
            preventionRecommendations: [],
          },
        } as any;
        break;

      case "custom":
        // Handle custom report with specified metrics
        if (!customMetrics || !Array.isArray(customMetrics)) {
          return NextResponse.json(
            { error: "Custom metrics array is required for custom reports" },
            { status: 400 },
          );
        }

        report = await generateCustomReport(
          fromDate,
          toDate,
          filters || {},
          customMetrics,
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown report type: ${reportType}` },
          { status: 400 },
        );
    }

    // Add additional data if requested
    if (includeRawData) {
      const userData = await userLifecycleService.getUsersLifecycleData(
        filters || {},
        { page: 1, limit: 1000 },
      );
      report.rawData = userData;
    }

    // Handle export format
    if (exportFormat === "csv") {
      return await generateCSVReport(report, reportType);
    } else if (exportFormat === "xlsx") {
      return await generateExcelReport(report, reportType);
    } else if (exportFormat === "pdf") {
      return await generatePDFReport(report, reportType);
    }

    console.log("Custom lifecycle report generated", {
      reportType,
      dateRange: { from: fromDate, to: toDate },
      includeCharts,
      includeRawData,
      customMetricsCount: customMetrics?.length || 0,
      adminId: session.user?.id,
    });

    return NextResponse.json({
      success: true,
      data: report,
      metadata: {
        reportType,
        generatedBy: session.user?.email,
        generatedAt: new Date(),
        includeCharts,
        includeRawData,
        customMetrics,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Custom lifecycle report API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date(),
      },
      { status: 500 },
    );
  }
}

// Helper functions for different export formats
async function generateCSVReport(report: any, reportType: string) {
  try {
    let csvContent = "";

    // Generate CSV based on report type
    switch (reportType) {
      case "comprehensive":
        csvContent = generateComprehensiveCSV(report);
        break;
      default:
        csvContent = generateGenericCSV(report);
    }

    const filename = `lifecycle_report_${reportType}_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV report" },
      { status: 500 },
    );
  }
}

async function generateExcelReport(report: any, reportType: string) {
  // This would require a library like 'xlsx' to generate Excel files
  // For now, return JSON with Excel mime type
  const filename = `lifecycle_report_${reportType}_${new Date().toISOString().split("T")[0]}.json`;

  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function generatePDFReport(report: any, reportType: string) {
  // This would require a library like 'puppeteer' or 'jsPDF' to generate PDFs
  // For now, return JSON with PDF-like structure
  const filename = `lifecycle_report_${reportType}_${new Date().toISOString().split("T")[0]}.json`;

  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function generateComprehensiveCSV(report: any): string {
  const lines: string[] = [];

  // Header
  lines.push("Lifecycle Report - Comprehensive");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Date Range: ${report.dateRange.from} to ${report.dateRange.to}`);
  lines.push("");

  // Overview
  lines.push("Overview");
  lines.push("Metric,Value");
  lines.push(`Total Users,${report.overview.totalUsers}`);
  lines.push(`New Users,${report.overview.newUsers}`);
  lines.push(`Active Users,${report.overview.activeUsers}`);
  lines.push(`Churned Users,${report.overview.churnedUsers}`);
  lines.push(`Reactivated Users,${report.overview.reactivatedUsers}`);
  lines.push("");

  // Stage Distribution
  lines.push("Stage Distribution");
  lines.push("Stage,User Count");
  Object.entries(report.stageDistribution || {}).forEach(([stage, count]) => {
    lines.push(`${stage},${count}`);
  });

  return lines.join("\n");
}

function generateGenericCSV(report: any): string {
  const lines: string[] = [];

  lines.push("Lifecycle Report");
  lines.push(`Generated: ${report.generatedAt || new Date()}`);
  lines.push(`Report Type: ${report.reportType || "Unknown"}`);
  lines.push("");
  lines.push("Data");
  lines.push(JSON.stringify(report.data || report, null, 2));

  return lines.join("\n");
}

async function generateCustomReport(
  dateFrom: Date,
  dateTo: Date,
  filters: UserLifecycleFilters,
  customMetrics: string[],
) {
  // This would generate a custom report based on specified metrics
  const report = {
    reportId: `custom_${Date.now()}`,
    reportType: "custom",
    generatedAt: new Date(),
    dateRange: { from: dateFrom, to: dateTo },
    customMetrics,
    data: {},
  } as any;

  // Add logic to fetch and calculate custom metrics
  for (const metric of customMetrics) {
    switch (metric) {
      case "user_count":
        // Add user count data
        break;
      case "engagement_trends":
        // Add engagement trends data
        break;
      case "conversion_rates":
        // Add conversion rates data
        break;
      // Add more custom metrics as needed
    }
  }

  return report;
}
