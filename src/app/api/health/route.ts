import { NextResponse } from "next/server";
import { checkDatabaseConnection, getDatabaseConnectionStatus } from "@/lib/db";

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connection health
    const dbHealth = await checkDatabaseConnection();
    const connectionStatus = getDatabaseConnectionStatus();
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: "operational",
          responseTime: `${responseTime}ms`,
        },
        database: {
          status: dbHealth.healthy ? "operational" : "error",
          connected: connectionStatus.connected,
          latency: dbHealth.latency ? `${dbHealth.latency}ms` : "unknown",
          error: dbHealth.error || null,
        },
      },
      environment: process.env.NODE_ENV || "unknown",
      version: process.env.npm_package_version || "unknown",
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          api: {
            status: "operational",
            responseTime: `${responseTime}ms`,
          },
          database: {
            status: "error",
            connected: false,
            error: error.message,
          },
        },
        environment: process.env.NODE_ENV || "unknown",
        version: process.env.npm_package_version || "unknown",
      },
      { status: 503 },
    );
  }
}
