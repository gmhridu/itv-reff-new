import { db } from "@/lib/db";
import * as cron from "node-cron";

interface CleanupConfig {
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
  private isRunning = false;

  private readonly config: CleanupConfig = {
    cronExpression: "0 0 * * *",
    enabled: true,
  };

  private constructor() {
    if (process.env.NODE_ENV === "development") {
      console.log("User Video Task Cleanup Service initialized (development mode)");
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
      console.log("User Video Task Cleanup Service disabled (development mode)");
      return;
    }

    try {
      this.job = cron.schedule(this.config.cronExpression, () => {
        this.cleanupUserVideoTasks().catch(console.error);
      });

      console.log(`User Video Task Cleanup Service started - Next run: ${this.getNextExecutionTime()}`);
      this.logCleanupEvent("STARTED", "Cleanup service started");
    } catch (error) {
      console.error("Failed to start User Video Task Cleanup Service:", error);
      this.logCleanupEvent("ERROR", `Failed to start service: ${error instanceof Error ? error.message : "Unknown error"}`);
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
   * Get next scheduled run (approximation)
   */
  public getNextExecutionTime(): Date | null {
    if (!this.job) return null;
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  /**
   * Get service status
   */
  public getStatus() {
    return {
      isRunning: this.job !== null,
      nextExecution: this.getNextExecutionTime(),
      enabled: this.config.enabled,
    };
  }

  private async performCleanup(): Promise<number> {
    try {
      const result = await db.userVideoTask.deleteMany({});
      console.log(`Deleted ${result.count} UserVideoTask records`);
      return result.count;
    } catch (error) {
      console.error("Error deleting UserVideoTask records:", error);
      throw error;
    }
  }

  private async cleanupUserVideoTasks(): Promise<void> {
    if (this.isRunning) {
      console.log("Cleanup already in progress, skipping...");
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

      await this.logCleanupEvent("COMPLETED", "Cleanup completed successfully", result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const result: CleanupResult = {
        success: false,
        deletedCount: 0,
        errors: [errorMessage],
        executionTime: Date.now() - startTime,
      };

      console.error("=== Cleanup Failed ===", error);
      await this.logCleanupEvent("ERROR", `Cleanup failed: ${errorMessage}`, result);
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
          level: eventType === "ERROR" ? "ERROR" : "INFO",
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

export const userVideoTaskCleanupService = UserVideoTaskCleanupService.getInstance();
