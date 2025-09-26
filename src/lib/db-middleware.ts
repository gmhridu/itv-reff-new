import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { NotificationService } from './notification-service';

export interface DatabaseMiddlewareOptions {
  enableRealTime?: boolean;
  enableLogging?: boolean;
  enableErrorReporting?: boolean;
  userId?: string;
}

export interface DatabaseContext {
  prisma: typeof prisma;
  notificationService?: NotificationService;
  userId?: string;
  requestId: string;
  startTime: Date;
}

export interface TransactionContext {
  prisma: {
    $transaction: any;
    [key: string]: any;
  };
  notificationService?: NotificationService;
  userId?: string;
  requestId: string;
  startTime: Date;
}

export class DatabaseMiddleware {
  private static notificationService: NotificationService;

  static setNotificationService(service: NotificationService) {
    this.notificationService = service;
  }

  static async executeWithContext<T>(
    operation: (context: DatabaseContext) => Promise<T>,
    options: DatabaseMiddlewareOptions = {}
  ): Promise<T> {
    const requestId = this.generateRequestId();
    const startTime = new Date();
    const context: DatabaseContext = {
      prisma,
      notificationService: this.notificationService,
      userId: options.userId,
      requestId,
      startTime,
    };

    try {
      if (options.enableLogging) {
        console.log(`[${requestId}] Starting database operation at ${startTime.toISOString()}`);
      }

      const result = await operation(context);

      if (options.enableLogging) {
        const duration = Date.now() - startTime.getTime();
        console.log(`[${requestId}] Database operation completed in ${duration}ms`);
      }

      // Emit real-time updates if enabled
      if (options.enableRealTime && this.notificationService) {
        await this.emitRealTimeUpdates(context, 'OPERATION_SUCCESS', result);
      }

      return result;
    } catch (error) {
      if (options.enableLogging) {
        console.error(`[${requestId}] Database operation failed:`, error);
      }

      if (options.enableErrorReporting) {
        await this.reportError(context, error as any);
      }

      // Emit error notifications
      if (options.enableRealTime && this.notificationService) {
        await this.emitRealTimeUpdates(context, 'OPERATION_ERROR', { error: (error as any)?.message });
      }

      throw error;
    }
  }

  static async withTransaction<T>(
    operations: (context: TransactionContext) => Promise<T>,
    options: DatabaseMiddlewareOptions = {}
  ): Promise<T> {
    return this.executeWithContext(async (context) => {
      return await context.prisma.$transaction(async (tx) => {
        const transactionContext: TransactionContext = {
          ...context,
          prisma: { ...context.prisma, $transaction: tx } as any,
        };

        return await operations(transactionContext);
      });
    }, options);
  }

  static async apiHandler<T = any>(
    handler: (context: DatabaseContext) => Promise<T>,
    options: DatabaseMiddlewareOptions = {}
  ) {
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.headers.get('x-user-id') || options.userId;
        const contextOptions = { ...options, userId };

        const result = await this.executeWithContext(handler, contextOptions);

        return NextResponse.json({
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('API Handler Error:', error);

        const statusCode = this.getStatusCodeFromError(error as any);
        const errorMessage = this.getErrorMessage(error as any);

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString(),
          },
          { status: statusCode }
        );
      }
    };
  }

  static async socketHandler<T = any>(
    handler: (context: DatabaseContext, socketData?: any) => Promise<T>,
    options: DatabaseMiddlewareOptions = {}
  ) {
    return async (socketData?: any): Promise<T> => {
      return this.executeWithContext(
        (context) => handler(context, socketData),
        options
      );
    };
  }

  private static generateRequestId(): string {
    return `db-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async emitRealTimeUpdates(
    context: DatabaseContext,
    event: string,
    data: any
  ): Promise<void> {
    if (!this.notificationService || !context.userId) return;

    try {
      await NotificationService.emitToUser(context.userId, {
        type: 'DATABASE_EVENT',
        event,
        data,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
      });
    } catch (error) {
      console.warn('Failed to emit real-time update:', error);
    }
  }

  private static async reportError(context: DatabaseContext, error: unknown): Promise<void> {
    try {
      const errorObj = error as any;
      // Log error to database for monitoring
      await context.prisma.systemLog.create({
        data: {
          level: 'ERROR',
          component: 'DATABASE_MIDDLEWARE',
          message: errorObj?.message || 'Unknown database error',
          error: JSON.stringify(error),
          metadata: JSON.stringify({
            requestId: context.requestId,
            userId: context.userId,
            duration: Date.now() - context.startTime.getTime(),
          }),
        },
      });
    } catch (logError) {
      console.warn('Failed to log error to database:', logError);
    }
  }

  private static getStatusCodeFromError(error: unknown): number {
    const errorObj = error as any;
    if (errorObj?.code === 'P2002') return 409; // Unique constraint violation
    if (errorObj?.code === 'P2025') return 404; // Record not found
    if (errorObj?.code === 'P2003') return 400; // Foreign key constraint failed
    if (errorObj?.code === 'P1001') return 503; // Can't reach database server
    if (errorObj?.code === 'P1008') return 504; // Connection timeout

    return 500; // Internal server error
  }

  private static getErrorMessage(error: unknown): string {
    const errorObj = error as any;
    if (errorObj?.code === 'P2002') {
      return 'A record with this information already exists';
    }
    if (errorObj?.code === 'P2025') {
      return 'The requested record was not found';
    }
    if (errorObj?.code === 'P2003') {
      return 'Invalid reference to another record';
    }
    if (errorObj?.code === 'P1001') {
      return 'Database server is currently unavailable';
    }
    if (errorObj?.code === 'P1008') {
      return 'Database connection timeout';
    }

    return errorObj?.message || 'An unexpected database error occurred';
  }

  // Utility methods for common database operations
  static async safeCreate<T extends { id: string }>(
    model: any,
    data: any,
    context: DatabaseContext | TransactionContext
  ): Promise<T> {
    try {
      return await model.create({ data });
    } catch (error) {
      const errorObj = error as any;
      throw new Error(`Failed to create record: ${errorObj?.message || 'Unknown error'}`);
    }
  }

  static async safeUpdate<T extends { id: string }>(
    model: any,
    where: any,
    data: any,
    context: DatabaseContext | TransactionContext
  ): Promise<T> {
    try {
      return await model.update({ where, data });
    } catch (error) {
      const errorObj = error as any;
      if (errorObj?.code === 'P2025') {
        throw new Error('Record not found');
      }
      throw new Error(`Failed to update record: ${errorObj?.message || 'Unknown error'}`);
    }
  }

  static async safeDelete(
    model: any,
    where: any,
    context: DatabaseContext | TransactionContext
  ): Promise<void> {
    try {
      await model.delete({ where });
    } catch (error) {
      const errorObj = error as any;
      if (errorObj?.code === 'P2025') {
        throw new Error('Record not found');
      }
      throw new Error(`Failed to delete record: ${errorObj?.message || 'Unknown error'}`);
    }
  }
}

// Export convenience functions
export const withDatabase = DatabaseMiddleware.executeWithContext;
export const withTransaction = DatabaseMiddleware.withTransaction;
export const withApiHandler = DatabaseMiddleware.apiHandler;
export const withSocketHandler = DatabaseMiddleware.socketHandler;
