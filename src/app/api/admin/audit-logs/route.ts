import { NextRequest, NextResponse } from "next/server";
import { auditService } from "@/lib/admin/audit-service";
import { ApiResponse } from "@/types/admin";
import { AuditAction } from "@/lib/admin/audit-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Parse filter parameters
    const filters: any = {};

    const adminId = searchParams.get("adminId");
    if (adminId) {
      filters.adminId = adminId;
    }

    const action = searchParams.get("action") as AuditAction;
    if (action && Object.values(AuditAction).includes(action)) {
      filters.action = action;
    }

    const targetType = searchParams.get("targetType");
    if (targetType) {
      filters.targetType = targetType;
    }

    const targetId = searchParams.get("targetId");
    if (targetId) {
      filters.targetId = targetId;
    }

    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");

    if (dateFromParam) {
      const dateFrom = new Date(dateFromParam);
      if (!isNaN(dateFrom.getTime())) {
        filters.dateFrom = dateFrom;
      }
    }

    if (dateToParam) {
      const dateTo = new Date(dateToParam);
      if (!isNaN(dateTo.getTime())) {
        filters.dateTo = dateTo;
      }
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pagination parameters",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Get audit logs
    const auditLogs = await auditService.getAuditLogs(filters, page, limit);

    return NextResponse.json(
      {
        success: true,
        data: auditLogs,
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Audit logs API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit logs",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "export") {
      // Export audit logs as CSV
      const body = await req.json();
      const { filters = {} } = body;

      const csvData = await auditService.exportAuditLogs(filters);

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="audit_logs.csv"',
        },
      });
    }

    if (action === "cleanup") {
      // Clean up old audit logs
      const body = await req.json();
      const { retentionDays = 365 } = body;

      if (typeof retentionDays !== "number" || retentionDays < 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid retention days",
          } as ApiResponse,
          { status: 400 },
        );
      }

      const deletedCount = await auditService.cleanupOldLogs(retentionDays);

      return NextResponse.json(
        {
          success: true,
          data: { deletedCount },
          message: `Deleted ${deletedCount} old audit logs`,
        } as ApiResponse,
        { status: 200 },
      );
    }

    if (action === "statistics") {
      // Get audit statistics
      const body = await req.json();
      const { dateFrom, dateTo } = body;

      const dateFromParsed = dateFrom ? new Date(dateFrom) : undefined;
      const dateToParsed = dateTo ? new Date(dateTo) : undefined;

      if (dateFrom && isNaN(dateFromParsed!.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid dateFrom parameter",
          } as ApiResponse,
          { status: 400 },
        );
      }

      if (dateTo && isNaN(dateToParsed!.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid dateTo parameter",
          } as ApiResponse,
          { status: 400 },
        );
      }

      const statistics = await auditService.getAuditStatistics(
        dateFromParsed,
        dateToParsed,
      );

      return NextResponse.json(
        {
          success: true,
          data: statistics,
        } as ApiResponse,
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      } as ApiResponse,
      { status: 400 },
    );
  } catch (error) {
    console.error("Audit logs action API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform audit logs action",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
