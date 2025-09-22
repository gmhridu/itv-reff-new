// Main exports for user lifecycle module
export * from './types';
export * from './config';
export * from './service';
export * from './event-tracking';
export * from './analytics';

// Main service instances
export { userLifecycleService } from './service';
export { eventTracker, trackUserEvent, getUserEventHistory } from './event-tracking';
export { userLifecycleAnalyticsService } from './analytics';

// Configuration and constants
export { DEFAULT_LIFECYCLE_CONFIG, SEGMENT_RULES, JOURNEY_PHASE_MAPPING, MILESTONE_DEFINITIONS } from './config';

// Convenience functions for common operations
export const initializeUserLifecycle = async (userId: string) => {
  const { userLifecycleService } = await import('./service');
  const { trackUserEvent } = await import('./event-tracking');
  const { UserLifecycleEvent, EventSource } = await import('./types');

  return trackUserEvent(
    userId,
    UserLifecycleEvent.USER_REGISTERED,
    {},
    EventSource.SYSTEM_TRIGGER
  );
};

export const getUserLifecycleData = async (userId: string) => {
  const { userLifecycleService } = await import('./service');
  return userLifecycleService.getUserLifecycleData(userId);
};

export const getDashboardMetrics = async (dateFrom: Date, dateTo: Date) => {
  const { userLifecycleAnalyticsService } = await import('./analytics');
  return userLifecycleAnalyticsService.getDashboardMetrics({ dateFrom, dateTo });
};

export const generateLifecycleReport = async (dateFrom: Date, dateTo: Date) => {
  const { userLifecycleService } = await import('./service');
  return userLifecycleService.generateLifecycleReport(dateFrom, dateTo);
};
