/**
 * Scheduler Initialization Service
 *
 * Ensures the daily task scheduler is properly initialized when the server starts.
 * This should be imported in the main server file or layout.
 */

import { dailyTaskScheduler } from "@/lib/daily-task-scheduler";

export function initializeScheduler(): void {
  try {
    // Start the scheduler
    dailyTaskScheduler.start();

    console.log("✅ Daily Task Scheduler initialized successfully");

    // Add graceful shutdown handlers
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, stopping scheduler...');
      dailyTaskScheduler.stop();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, stopping scheduler...');
      dailyTaskScheduler.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Failed to initialize Daily Task Scheduler:", error);
  }
}

// Auto-initialize in production or when explicitly requested
if (process.env.NODE_ENV === "production" || process.env.INITIALIZE_SCHEDULER === "true") {
  initializeScheduler();
}
