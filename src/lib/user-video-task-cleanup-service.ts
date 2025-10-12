import { db } from "@/lib/db";
import * as cron from "node-cron";

interface CleanupConfig {
  timezone: string;
  cronExpression: string;
  enabled: boolean;
}

interface CleanupResult {
  success: boolean;
  deletedCount: number;
  errors: string[];
  executionTime: number;
}

export class UserVideoTaskCleanupService {
  private static instance: UserVideoTaskCleanupService;
  private job: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  // Asia/Karachi timezone configuration (UTC+5)
  private readonly config: CleanupConfig = {
    timezone: "Asia/Karachi",
    cronExpression: "1 0 * * *", // Every day at 12:01 AM
    enabled: process.env.NODE_ENV === "production",
  };

  private constructor() {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "User Video Task Cleanup Service initialized in development mode"
      );
    }
  }

  public static getInstance(): UserVideoTaskCleanupService {
    if (!UserVideoTaskCleanupService.instance) {
      UserVideoTaskCleanupService.instance = new UserVideoTaskCleanupService();
    }
    return UserVideoTaskCleanupService.instance;
  }

  /**
   * Start the cleanup service
   */
  public start(): void {
    if (this.job) {
      console.log("User Video Task Cleanup Service is already running");
      return;
    }

    if (!this.config.enabled) {
      console.log(
        "User Video Task Cleanup Service is disabled (development mode)"
      );
      return;
    }

    try {
      this.job = cron.schedule(
        this.config.cronExpression,
        this.cleanupUserVideoTasks.bind(this),
        {
          timezone: this.config.timezone,
        }
      );

      console.log(
        `User Video Task Cleanup Service started - Next run: ${this.getNextExecutionTime()}`
      );
      console.log(
        `Timezone: ${this.config.timezone}, Cron: ${this.config.cronExpression}`
      );

      // Log service start to database
      this.logCleanupEvent(
        "STARTED",
        `Cleanup service started with timezone ${this.config.timezone}`
      );
    } catch (error) {
      console.error("Failed to start User Video Task Cleanup Service:", error);
      this.logCleanupEvent(
        "ERROR",
        `Failed to start cleanup service: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Stop the cleanup service
   */
  public stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log("User Video Task Cleanup Service stopped");
      this.logCleanupEvent("STOPPED", "Cleanup service manually stopped");
    }
  }

  /**
   * Get the next scheduled execution time
   */
  public getNextExecutionTime(): Date | null {
    // Return next execution time (simplified for compatibility)
    if (!this.job) return null;
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 1); // Tomorrow
    nextRun.setHours(0, 1, 0, 0); // 12:01 AM
    return nextRun;
  }

  /**
   * Get service status
   */
  public getStatus(): {
    isRunning: boolean;
    nextExecution: Date | null;
    timezone: string;
    enabled: boolean;
  } {
    return {
      isRunning: this.job !== null,
      nextExecution: this.getNextExecutionTime(),
      timezone: this.config.timezone,
      enabled: this.config.enabled,
    };
  }

  private async performCleanup(): Promise<number> {
    try {
      const deleteResult = await db.userVideoTask.deleteMany({});
      const deletedCount = deleteResult.count;

      console.log(`Deleted ${deletedCount} UserVideoTask records`);

      return deletedCount;
    } catch (error) {
      console.error("Error deleting UserVideoTask records:", error);
      throw error;
    }
  }

  private async cleanupUserVideoTasks(): Promise<void> {
    if (this.isRunning) {
      console.log("User video task cleanup already in progress, skipping...");
      return;
    }

    const startTime = Date.now();
    this.isRunning = true;

    try {
      console.log("=== Starting User Video Task Cleanup ===");

      const deletedCount = await this.performCleanup();

      const executionTime = Date.now() - startTime;
      const result: CleanupResult = {
        success: true,
        deletedCount,
        errors: [],
        executionTime,
      };

      // Log successful cleanup
      await this.logCleanupEvent(
        "COMPLETED",
        `Daily cleanup completed successfully`,
        result
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("=== User Video Task Cleanup Failed ===");
      console.error("Error:", error);

      const result: CleanupResult = {
        success: false,
        deletedCount: 0,
        errors: [errorMessage],
        executionTime,
      };

      await this.logCleanupEvent(
        "ERROR",
        `Daily cleanup failed: ${errorMessage}`,
        result
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async logCleanupEvent(
    eventType: string,
    message: string,
    result?: CleanupResult
  ): Promise<void> {
    try {
      await db.systemLog.create({
        data: {
          level: "INFO",
          component: "USER_VIDEO_TASK_CLEANUP",
          message: `[${eventType}] ${message}`,
          metadata: result ? JSON.stringify(result) : undefined,
        },
      });
    } catch (error) {
      console.error("Failed to log cleanup event:", error);
    }
  }
}

export const userVideoTaskCleanupService =
  UserVideoTaskCleanupService.getInstance();
