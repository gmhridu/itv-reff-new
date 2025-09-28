import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Simple database health check function
async function checkDatabaseConnection() {
  try {
    // Perform a simple query to check connection
    await db.$queryRaw`SELECT 1`;
    return {
      healthy: true,
      latency: 0,
      error: null
    };
  } catch (error: any) {
    return {
      healthy: false,
      latency: 0,
      error: error.message
    };
  }
}

// Simple connection status function
function getDatabaseConnectionStatus() {
  try {
    // Check if Prisma client is initialized
    return {
      connected: !!db,
    };
  } catch {
    return {
      connected: false,
    };
  }
}

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