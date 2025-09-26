import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Type-safe global declaration for development
declare global {
  var prisma: PrismaClient | undefined;
}

// Database connection configuration with retry mechanism
const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL!,
      },
    },
    errorFormat: "pretty",
  });
};

// Database connection with retry logic and improved error handling
async function connectWithRetry(
  client: PrismaClient,
  maxRetries = 10,
  delay = 2000,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Test connection with a simple query
      await client.$queryRaw`SELECT 1`;
      console.log("Database connected and tested successfully");
      return;
    } catch (error: any) {
      console.error(`Database connection attempt ${i + 1} failed:`, {
        error: error.message,
        code: error.code,
        meta: error.meta,
      });

      // Check for specific network errors
      const isNetworkError =
        error.message?.includes("Can't reach database server") ||
        error.message?.includes("Connection reset by peer") ||
        error.code === "P1001";

      if (i === maxRetries - 1) {
        if (isNetworkError) {
          console.error(
            "⚠️  Database server is unreachable. This may be a temporary network issue.",
          );
          // Don't throw in production to allow graceful degradation
          if (process.env.NODE_ENV === "production") {
            console.warn(
              "🔄 Continuing without initial connection - will retry on first request",
            );
            return;
          }
        }
        throw new Error(
          `Failed to connect to database after ${maxRetries} attempts: ${error.message}`,
        );
      }

      // Exponential backoff with jitter
      const backoffDelay = delay * Math.pow(1.5, i) + Math.random() * 1000;
      console.log(
        `⏳ Retrying database connection in ${Math.round(backoffDelay)}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }
}

// Create database client with connection retry
export const db = globalThis.prisma ?? createPrismaClient();

// Connection state tracking
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

// Initialize connection with retry mechanism
if (!globalThis.prisma) {
  // Always attempt connection but handle failures gracefully
  connectionPromise = connectWithRetry(db)
    .then(() => {
      isConnected = true;
    })
    .catch((error) => {
      console.error("⚠️  Initial database connection failed:", error.message);
      console.log(
        "🔄 Database operations will attempt to reconnect automatically",
      );
      isConnected = false;
    });
}

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

// Graceful shutdown with error handling
process.on("SIGINT", async () => {
  try {
    await db.$disconnect();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  try {
    await db.$disconnect();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  try {
    await db.$disconnect();
  } catch (disconnectError) {
    console.error("Error disconnecting database:", disconnectError);
  }
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  try {
    await db.$disconnect();
  } catch (disconnectError) {
    console.error("Error disconnecting database:", disconnectError);
  }
  process.exit(1);
});

// Enhanced health check function
export async function checkDatabaseConnection(): Promise<{
  healthy: boolean;
  error?: string;
  latency?: number;
}> {
  const startTime = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    isConnected = true;

    return {
      healthy: true,
      latency,
    };
  } catch (error: any) {
    console.error("Database health check failed:", error);
    isConnected = false;

    // Provide more helpful error messages for common issues
    let errorMessage = error.message;
    if (error.message?.includes("Can't reach database server")) {
      errorMessage = "Database server is unreachable. This may be due to:\n" +
        "1. Database is paused (Neon auto-pauses inactive databases)\n" +
        "2. Network connectivity issues\n" +
        "3. Incorrect connection credentials\n" +
        "Please check your Neon console and resume the database if paused.";
    }

    return {
      healthy: false,
      error: errorMessage,
      latency: Date.now() - startTime,
    };
  }
}

// Enhanced database operation wrapper with connection recovery
export async function withRetry<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  maxRetries = 5,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // If not connected and we have a connection promise, wait for it
      if (!isConnected && connectionPromise) {
        await connectionPromise.catch(() => {}); // Ignore initial connection errors
      }

      return await operation(db);
    } catch (error: any) {
      console.error(`Database operation attempt ${i + 1} failed:`, {
        error: error.message,
        code: error.code,
        attempt: i + 1,
        maxRetries,
      });

      // Don't retry on certain application errors
      const nonRetryableCodes = ["P2002", "P2025", "P2003", "P2004"];
      if (nonRetryableCodes.includes(error.code)) {
        throw error;
      }

      // Check for connection errors
      const isConnectionError =
        error.message?.includes("Can't reach database server") ||
        error.message?.includes("Connection reset by peer") ||
        error.code === "P1001" ||
        error.code === "P1017";

      if (isConnectionError) {
        console.log("🔄 Attempting database reconnection...");
        isConnected = false;

        try {
          await db.$connect();
          await db.$queryRaw`SELECT 1`; // Test the connection
          isConnected = true;
          console.log("✅ Database reconnected successfully");
        } catch (reconnectError) {
          console.error("❌ Reconnection failed:", reconnectError);
        }
      }

      if (i === maxRetries - 1) {
        if (isConnectionError) {
          throw new Error(
            `Database connection failed after ${maxRetries} attempts. Please check your internet connection and try again.`,
          );
        }
        throw error;
      }

      // Exponential backoff with jitter
      const backoffDelay = 1000 * Math.pow(1.5, i) + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw new Error("Unreachable code");
}

// Connection status getter
export function getDatabaseConnectionStatus(): {
  connected: boolean;
  lastError?: string;
} {
  return {
    connected: isConnected,
  };
}
