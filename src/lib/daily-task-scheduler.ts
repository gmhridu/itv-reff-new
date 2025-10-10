/**
 * Daily Task Scheduler Service
 *
 * Handles automatic daily task processing and resets at 12 AM Pakistani time (Asia/Karachi timezone).
 * Processes task bonuses for the previous day and resets daily counters.
 */

import { TaskBonusService } from "@/lib/task-bonus-service";
import { db } from "@/lib/db";
import * as cron from "node-cron";

interface SchedulerConfig {
  timezone: string;
  cronExpression: string;
  enabled: boolean;
}

interface ProcessingResult {
  success: boolean;
  date: string;
  bonusesProcessed: number;
  totalDistributed: number;
  errors: string[];
  executionTime: number;
}

export class DailyTaskScheduler {
  private static instance: DailyTaskScheduler;
  private job: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  // Asia/Karachi timezone configuration (UTC+5)
  private readonly config: SchedulerConfig = {
    timezone: "Asia/Karachi",
    cronExpression: "0 0 * * *", // Every day at 12:00 AM
    enabled: process.env.NODE_ENV === "production"
  };

  private constructor() {
    if (process.env.NODE_ENV === "development") {
      console.log("Daily Task Scheduler initialized in development mode");
    }
  }

  public static getInstance(): DailyTaskScheduler {
    if (!DailyTaskScheduler.instance) {
      DailyTaskScheduler.instance = new DailyTaskScheduler();
    }
    return DailyTaskScheduler.instance;
  }

  /**
   * Start the daily task scheduler
   */
  public start(): void {
    if (this.job) {
      console.log("Daily Task Scheduler is already running");
      return;
    }

    if (!this.config.enabled) {
      console.log("Daily Task Scheduler is disabled (development mode)");
      return;
    }

    try {
      this.job = cron.schedule(
        this.config.cronExpression,
        this.processDailyTasks.bind(this),
        {
          timezone: this.config.timezone
        }
      );

      console.log(`Daily Task Scheduler started - Next run: ${this.getNextExecutionTime()}`);
      console.log(`Timezone: ${this.config.timezone}, Cron: ${this.config.cronExpression}`);

      // Log scheduler start to database
      this.logSchedulerEvent("STARTED", `Scheduler started with timezone ${this.config.timezone}`);

    } catch (error) {
      console.error("Failed to start Daily Task Scheduler:", error);
      this.logSchedulerEvent("ERROR", `Failed to start scheduler: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop the daily task scheduler
   */
  public stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log("Daily Task Scheduler stopped");
      this.logSchedulerEvent("STOPPED", "Scheduler manually stopped");
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
    nextRun.setHours(0, 0, 0, 0); // 12 AM
    return nextRun;
  }

  /**
   * Get scheduler status
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
      enabled: this.config.enabled
    };
  }

  /**
   * Process daily tasks - main scheduler function
   */
  private async processDailyTasks(): Promise<void> {
    if (this.isRunning) {
      console.log("Daily task processing already in progress, skipping...");
      return;
    }

    const startTime = Date.now();
    this.isRunning = true;

    try {
      console.log("=== Starting Daily Task Processing ===");

      // Get yesterday's date in Asia/Karachi timezone
      const yesterday = this.getYesterdayKarachiTime();

      console.log(`Processing tasks for date: ${yesterday.toDateString()} (${yesterday.toISOString()})`);

      // Process daily task bonuses for all eligible users
      const bonusResult = await TaskBonusService.processDailyTaskBonusesForAllUsers(yesterday);

      // Reset daily counters if needed
      await this.resetDailyCounters(yesterday);


      const executionTime = Date.now() - startTime;
      const result: ProcessingResult = {
        success: true,
        date: yesterday.toISOString(),
        bonusesProcessed: bonusResult.successful,
        totalDistributed: bonusResult.totalBonusDistributed,
        errors: [],
        executionTime
      };

      console.log("=== Daily Task Processing Completed ===");
      console.log(`Processed: ${bonusResult.processed} users`);
      console.log(`Successful: ${bonusResult.successful} bonuses`);
      console.log(`Failed: ${bonusResult.failed}`);
      console.log(`Total Distributed: PKR ${bonusResult.totalBonusDistributed}`);
      console.log(`Execution Time: ${executionTime}ms`);

      // Log successful processing
      await this.logSchedulerEvent("COMPLETED", `Daily processing completed successfully for ${yesterday.toDateString()}`, result);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error("=== Daily Task Processing Failed ===");
      console.error("Error:", error);

      const result: ProcessingResult = {
        success: false,
        date: new Date().toISOString(),
        bonusesProcessed: 0,
        totalDistributed: 0,
        errors: [errorMessage],
        executionTime
      };

      // Log error
      await this.logSchedulerEvent("ERROR", `Daily processing failed: ${errorMessage}`, result);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get yesterday's date in Asia/Karachi timezone
   */
  private getYesterdayKarachiTime(): Date {
    // Create date in Asia/Karachi timezone
    const karachiTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const yesterday = new Date(karachiTime);
    yesterday.setDate(yesterday.getDate() - 1);

    return yesterday;
  }

  /**
   * Reset daily counters and states
   */
  private async resetDailyCounters(date: Date): Promise<void> {
    try {
      // Reset any daily counters if your system has them
      // This is a placeholder for any daily reset operations you might need

      console.log(`Resetting daily counters for ${date.toDateString()}`);

      // Example: Reset daily login attempts, rate limiting counters, etc.
      // You can add specific reset logic here based on your requirements

    } catch (error) {
      console.error("Error resetting daily counters:", error);
      throw error;
    }
  }


  /**
   * Log scheduler events to database
   */
  private async logSchedulerEvent(
    event: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    try {
      await db.systemLog.create({
        data: {
          level: event === "ERROR" ? "ERROR" : "INFO",
          component: "DAILY_TASK_SCHEDULER",
          message: `Scheduler: ${message}`,
          metadata: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            ...metadata
          })
        }
      });
    } catch (error) {
      console.error("Failed to log scheduler event:", error);
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  public async triggerManualProcessing(date?: Date): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      console.log("=== Manual Daily Task Processing Triggered ===");

      const targetDate = date || this.getYesterdayKarachiTime();
      const bonusResult = await TaskBonusService.processDailyTaskBonusesForAllUsers(targetDate);

      const executionTime = Date.now() - startTime;

      const result: ProcessingResult = {
        success: true,
        date: targetDate.toISOString(),
        bonusesProcessed: bonusResult.successful,
        totalDistributed: bonusResult.totalBonusDistributed,
        errors: [],
        executionTime
      };

      console.log("Manual processing completed:", result);
      await this.logSchedulerEvent("MANUAL_TRIGGER", `Manual processing completed for ${targetDate.toDateString()}`, result);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const result: ProcessingResult = {
        success: false,
        date: new Date().toISOString(),
        bonusesProcessed: 0,
        totalDistributed: 0,
        errors: [errorMessage],
        executionTime
      };

      await this.logSchedulerEvent("ERROR", `Manual processing failed: ${errorMessage}`, result);
      throw error;
    }
  }
}

// Export singleton instance
export const dailyTaskScheduler = DailyTaskScheduler.getInstance();
