// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from "@/lib/socket";
import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOSTNAME = isProduction ? "0.0.0.0" : "localhost";

// Fix SSL certificate issues in production
if (isProduction) {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
}

// Server configuration
const SERVER_CONFIG = {
  port: PORT,
  hostname: HOSTNAME,
  environment: NODE_ENV,
};

// Next.js app configuration
const NEXT_CONFIG = {
  dev: !isProduction,
  dir: process.cwd(),
  conf: isProduction
    ? {
        distDir: "./.next",
        experimental: {
          serverComponentsExternalPackages: ["@prisma/client", "prisma"],
        },
      }
    : undefined,
};

/**
 * Initialize Next.js application
 */
async function initNextApp() {
  try {
    const nextApp = next(NEXT_CONFIG);
    await nextApp.prepare();
    return nextApp;
  } catch (error) {
    console.error("Failed to initialize Next.js application:", error);
    throw new Error(`Next.js initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create and configure HTTP server
 */
function createHttpServer(nextApp: any) {
  const handle = nextApp.getRequestHandler();
  
  return createServer((req, res) => {
    // Skip socket.io requests from Next.js handler
    if (req.url?.startsWith("/api/socketio")) {
      return;
    }
    handle(req, res);
  });
}

/**
 * Configure Socket.IO server
 */
function configureSocketIO(server: any) {
  return new Server(server, {
    path: "/api/socketio",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server: any) {
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully`);
    
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

/**
 * Log server startup information
 */
function logServerInfo() {
  console.log(`> Ready on http://${SERVER_CONFIG.hostname}:${SERVER_CONFIG.port}`);
  console.log(`> Socket.IO server running at ws://${SERVER_CONFIG.hostname}:${SERVER_CONFIG.port}/api/socketio`);
  console.log(`> Environment: ${SERVER_CONFIG.environment}`);
  console.log(`> Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`);
}

/**
 * Main server initialization function
 */
async function createCustomServer() {
  try {
    console.log(`Starting server in ${SERVER_CONFIG.environment} mode...`);
    
    // Initialize Next.js app
    const nextApp = await initNextApp();
    
    // Create HTTP server
    const server = createHttpServer(nextApp);
    
    // Setup Socket.IO
    const io = configureSocketIO(server);
    setupSocket(io);
    
    // Setup graceful shutdown
    setupGracefulShutdown(server);
    
    // Start server
    server.listen(SERVER_CONFIG.port, SERVER_CONFIG.hostname, () => {
      logServerInfo();
    });
    
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
}

// Start the server
createCustomServer().catch((error) => {
  console.error("Unhandled error during server startup:", error);
  process.exit(1);
});