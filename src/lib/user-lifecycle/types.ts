export enum UserLifecycleStage {
  // Initial stages
  REGISTERED = "REGISTERED",
  PROFILE_INCOMPLETE = "PROFILE_INCOMPLETE",
  PROFILE_COMPLETE = "PROFILE_COMPLETE",

  // Onboarding stages
  FIRST_LOGIN = "FIRST_LOGIN",
  ONBOARDING_STARTED = "ONBOARDING_STARTED",
  ONBOARDING_COMPLETED = "ONBOARDING_COMPLETED",

  // Engagement stages
  FIRST_VIDEO_TASK = "FIRST_VIDEO_TASK",
  FIRST_EARNING = "FIRST_EARNING",
  REGULAR_USER = "REGULAR_USER",

  // Growth stages
  POSITION_UPGRADED = "POSITION_UPGRADED",
  FIRST_REFERRAL = "FIRST_REFERRAL",
  ACTIVE_REFERRER = "ACTIVE_REFERRER",

  // Retention stages
  HIGHLY_ENGAGED = "HIGHLY_ENGAGED",
  MODERATELY_ENGAGED = "MODERATELY_ENGAGED",
  LOW_ENGAGEMENT = "LOW_ENGAGEMENT",

  // Risk stages
  AT_RISK = "AT_RISK",
  INACTIVE = "INACTIVE",
  CHURNED = "CHURNED",

  // Recovery stages
  REACTIVATED = "REACTIVATED",

  // Special stages
  VIP_USER = "VIP_USER",
  PROBLEM_USER = "PROBLEM_USER",
}

export enum UserLifecycleEvent {
  // Registration events
  USER_REGISTERED = "USER_REGISTERED",
  EMAIL_VERIFIED = "EMAIL_VERIFIED",
  PHONE_VERIFIED = "PHONE_VERIFIED",

  // Profile events
  PROFILE_UPDATED = "PROFILE_UPDATED",
  PROFILE_COMPLETED = "PROFILE_COMPLETED",
  BANK_CARD_ADDED = "BANK_CARD_ADDED",

  // Authentication events
  FIRST_LOGIN = "FIRST_LOGIN",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",

  // Task events
  FIRST_VIDEO_WATCHED = "FIRST_VIDEO_WATCHED",
  VIDEO_TASK_COMPLETED = "VIDEO_TASK_COMPLETED",
  DAILY_TASK_GOAL_ACHIEVED = "DAILY_TASK_GOAL_ACHIEVED",
  WEEKLY_TASK_GOAL_ACHIEVED = "WEEKLY_TASK_GOAL_ACHIEVED",

  // Financial events
  FIRST_EARNING = "FIRST_EARNING",
  MILESTONE_EARNING = "MILESTONE_EARNING",
  FIRST_WITHDRAWAL = "FIRST_WITHDRAWAL",
  WITHDRAWAL_COMPLETED = "WITHDRAWAL_COMPLETED",
  DEPOSIT_MADE = "DEPOSIT_MADE",

  // Position events
  POSITION_UPGRADED = "POSITION_UPGRADED",
  POSITION_DOWNGRADED = "POSITION_DOWNGRADED",
  INTERN_TO_PAID = "INTERN_TO_PAID",

  // Referral events
  FIRST_REFERRAL = "FIRST_REFERRAL",
  REFERRAL_MILESTONE = "REFERRAL_MILESTONE",
  REFERRAL_REWARD_EARNED = "REFERRAL_REWARD_EARNED",

  // Engagement events
  STREAK_STARTED = "STREAK_STARTED",
  STREAK_BROKEN = "STREAK_BROKEN",
  STREAK_MILESTONE = "STREAK_MILESTONE",

  // Risk events
  MISSED_DAILY_TARGET = "MISSED_DAILY_TARGET",
  LONG_INACTIVITY = "LONG_INACTIVITY",
  MULTIPLE_LOGIN_FAILURES = "MULTIPLE_LOGIN_FAILURES",

  // Recovery events
  RETURNED_AFTER_INACTIVITY = "RETURNED_AFTER_INACTIVITY",
  RE_ENGAGEMENT_CAMPAIGN_OPENED = "RE_ENGAGEMENT_CAMPAIGN_OPENED",

  // Administrative events
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
  ACCOUNT_REACTIVATED = "ACCOUNT_REACTIVATED",
  MANUAL_BALANCE_ADJUSTMENT = "MANUAL_BALANCE_ADJUSTMENT",
}

export enum UserSegment {
  NEW_USERS = "NEW_USERS",
  ACTIVE_USERS = "ACTIVE_USERS",
  POWER_USERS = "POWER_USERS",
  AT_RISK_USERS = "AT_RISK_USERS",
  CHURNED_USERS = "CHURNED_USERS",
  HIGH_VALUE_USERS = "HIGH_VALUE_USERS",
  REFERRAL_CHAMPIONS = "REFERRAL_CHAMPIONS",
  TASK_COMPLETERS = "TASK_COMPLETERS",
  LOW_ENGAGEMENT = "LOW_ENGAGEMENT",
  REACTIVATED_USERS = "REACTIVATED_USERS",
}

export enum UserJourneyPhase {
  ACQUISITION = "ACQUISITION",
  ACTIVATION = "ACTIVATION",
  RETENTION = "RETENTION",
  REVENUE = "REVENUE",
  REFERRAL = "REFERRAL",
  REACTIVATION = "REACTIVATION",
  CHURN = "CHURN",
}

export interface UserLifecycleData {
  userId: string;
  currentStage: UserLifecycleStage;
  previousStage?: UserLifecycleStage;
  stageEnteredAt: Date;
  daysSinceRegistration: number;
  daysSinceLastActivity: number;
  totalLifetimeValue: number;
  engagementScore: number;
  riskScore: number;
  segment: UserSegment;
  journeyPhase: UserJourneyPhase;

  // Stage progression tracking
  stageHistory: UserStageTransition[];

  // Key metrics
  metrics: UserLifecycleMetrics;

  // Predictions
  churnProbability?: number;
  nextStageTimeline?: number; // days
  lifetimeValuePrediction?: number;
}

export interface UserStageTransition {
  fromStage: UserLifecycleStage | undefined;
  toStage: UserLifecycleStage;
  transitionDate: Date;
  triggerEvent: UserLifecycleEvent;
  daysInPreviousStage?: number;
  metadata?: Record<string, any>;
}

export interface UserLifecycleMetrics {
  // Time-based metrics
  timeToFirstLogin?: number; // hours
  timeToFirstVideoTask?: number; // hours
  timeToFirstEarning?: number; // hours
  timeToFirstReferral?: number; // days
  timeToPositionUpgrade?: number; // days

  // Engagement metrics
  totalVideoTasks: number;
  totalEarnings: number;
  totalReferrals: number;
  averageDailyTasks: number;
  longestStreak: number;
  currentStreak: number;

  // Financial metrics
  totalDeposits: number;
  totalWithdrawals: number;
  currentBalance: number;
  lifetimeValue: number;

  // Activity metrics
  totalLogins: number;
  lastLoginDate?: Date;
  averageSessionDuration?: number; // minutes

  // Milestone achievements
  milestones: UserMilestone[];
}

export interface UserMilestone {
  id: string;
  name: string;
  description: string;
  achievedAt: Date;
  category: MilestoneCategory;
  value?: number;
  metadata?: Record<string, any>;
}

export enum MilestoneCategory {
  EARNINGS = "EARNINGS",
  TASKS = "TASKS",
  REFERRALS = "REFERRALS",
  STREAK = "STREAK",
  POSITION = "POSITION",
  ENGAGEMENT = "ENGAGEMENT",
}

export interface UserLifecycleEventData {
  id: string;
  userId: string;
  eventType: UserLifecycleEvent;
  eventData: Record<string, any>;
  timestamp: Date;
  source: EventSource;

  // Context
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;

  // Impact
  stageTransition?: UserStageTransition;
  segmentChange?: {
    from: UserSegment;
    to: UserSegment;
  };
}

export enum EventSource {
  USER_ACTION = "USER_ACTION",
  SYSTEM_TRIGGER = "SYSTEM_TRIGGER",
  ADMIN_ACTION = "ADMIN_ACTION",
  SCHEDULED_TASK = "SCHEDULED_TASK",
  EXTERNAL_API = "EXTERNAL_API",
}

export interface UserJourneyAnalytics {
  userId: string;
  journeyStartDate: Date;
  currentPhase: UserJourneyPhase;

  // Funnel progression
  funnelSteps: JourneyFunnelStep[];
  conversionRate: number;

  // Time analysis
  totalJourneyTime: number; // days
  timeInCurrentPhase: number; // days
  averagePhaseTransitionTime: Record<UserJourneyPhase, number>;

  // Drop-off analysis
  dropOffPoints: DropOffPoint[];
  completionRate: number;

  // Cohort data
  registrationCohort: string; // YYYY-MM
  cohortPerformance: CohortMetrics;
}

export interface JourneyFunnelStep {
  step: string;
  phase: UserJourneyPhase;
  completedAt?: Date;
  timeToComplete?: number; // hours
  dropOffRisk: number; // 0-1 probability
}

export interface DropOffPoint {
  stage: UserLifecycleStage;
  event: UserLifecycleEvent;
  dropOffRate: number; // percentage
  commonReasons: string[];
  recoveryActions: string[];
}

export interface CohortMetrics {
  cohortId: string;
  cohortSize: number;
  retentionRates: Record<number, number>; // day -> retention rate
  averageLifetimeValue: number;
  averageEngagementScore: number;
  topPerformingSegments: UserSegment[];
}

export interface UserLifecycleConfiguration {
  // Stage transition rules
  stageTransitionRules: StageTransitionRule[];

  // Scoring algorithms
  engagementScoreWeights: EngagementScoreWeights;
  riskScoreWeights: RiskScoreWeights;

  // Thresholds
  thresholds: LifecycleThresholds;

  // Automation settings
  automationSettings: AutomationSettings;
}

export interface StageTransitionRule {
  fromStage: UserLifecycleStage | null;
  toStage: UserLifecycleStage;
  conditions: TransitionCondition[];
  priority: number;
}

export interface TransitionCondition {
  type: ConditionType;
  field: string;
  operator: ConditionOperator;
  value: any;
  timeWindow?: number; // days
}

export enum ConditionType {
  USER_PROPERTY = "USER_PROPERTY",
  EVENT_COUNT = "EVENT_COUNT",
  TIME_BASED = "TIME_BASED",
  CALCULATED_METRIC = "CALCULATED_METRIC",
}

export enum ConditionOperator {
  EQUALS = "EQUALS",
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN = "LESS_THAN",
  GREATER_EQUAL = "GREATER_EQUAL",
  LESS_EQUAL = "LESS_EQUAL",
  IN = "IN",
  NOT_IN = "NOT_IN",
  EXISTS = "EXISTS",
  NOT_EXISTS = "NOT_EXISTS",
}

export interface EngagementScoreWeights {
  dailyTaskCompletion: number;
  consistencyBonus: number;
  streakMultiplier: number;
  referralActivity: number;
  earningsGrowth: number;
  loginFrequency: number;
}

export interface RiskScoreWeights {
  inactivityPenalty: number;
  missedTasksPenalty: number;
  declineInEarnings: number;
  reducedLoginFrequency: number;
  negativeBalance: number;
  supportTickets: number;
}

export interface LifecycleThresholds {
  engagementScore: {
    high: number;
    medium: number;
    low: number;
  };
  riskScore: {
    high: number;
    medium: number;
    low: number;
  };
  inactivityDays: {
    atRisk: number;
    inactive: number;
    churned: number;
  };
  earningsMilestones: number[];
  taskMilestones: number[];
  referralMilestones: number[];
}

export interface AutomationSettings {
  enableStageTransitions: boolean;
  enableRiskDetection: boolean;
  enableReengagementCampaigns: boolean;
  enableMilestoneNotifications: boolean;

  // Notification settings
  notifications: {
    stageTransitions: boolean;
    milestoneAchievements: boolean;
    riskAlerts: boolean;
    reengagementTriggers: boolean;
  };

  // Campaign triggers
  campaignTriggers: {
    newUserOnboarding: boolean;
    inactivityReminders: boolean;
    milestoneRewards: boolean;
    winBackCampaigns: boolean;
  };
}

export interface UserLifecycleReport {
  reportId: string;
  generatedAt: Date;
  dateRange: {
    from: Date;
    to: Date;
  };

  // Overview metrics
  overview: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    churnedUsers: number;
    reactivatedUsers: number;
  };

  // Stage distribution
  stageDistribution: Record<UserLifecycleStage, number>;

  // Segment analysis
  segmentAnalysis: Record<UserSegment, SegmentAnalysis>;

  // Journey funnel
  journeyFunnel: JourneyFunnelAnalysis;

  // Cohort analysis
  cohortAnalysis: CohortAnalysis[];

  // Key insights
  insights: LifecycleInsight[];
}

export interface SegmentAnalysis {
  userCount: number;
  percentage: number;
  averageEngagementScore: number;
  averageLifetimeValue: number;
  retentionRate: number;
  conversionRate: number;
  topStages: UserLifecycleStage[];
}

export interface JourneyFunnelAnalysis {
  phases: JourneyPhaseMetrics[];
  overallConversionRate: number;
  averageJourneyTime: number;
  dropOffPoints: DropOffAnalysis[];
}

export interface JourneyPhaseMetrics {
  phase: UserJourneyPhase;
  userCount: number;
  conversionRate: number;
  averageTimeInPhase: number;
  dropOffRate: number;
}

export interface DropOffAnalysis {
  stage: UserLifecycleStage;
  dropOffCount: number;
  dropOffPercentage: number;
  commonReasons: string[];
  suggestedActions: string[];
}

export interface CohortAnalysis {
  cohortId: string;
  cohortStartDate: Date;
  initialSize: number;
  currentSize: number;
  retentionCurve: Record<number, number>; // day -> users retained
  lifetimeValueProgression: Record<number, number>; // day -> average LTV
  stageProgressions: Record<UserLifecycleStage, number>[];
}

export interface LifecycleInsight {
  id: string;
  title: string;
  description: string;
  category: InsightCategory;
  impact: InsightImpact;
  confidence: number; // 0-1
  recommendation: string;
  data: Record<string, any>;
}

export enum InsightCategory {
  CONVERSION = "CONVERSION",
  RETENTION = "RETENTION",
  ENGAGEMENT = "ENGAGEMENT",
  REVENUE = "REVENUE",
  RISK = "RISK",
  OPPORTUNITY = "OPPORTUNITY",
}

export enum InsightImpact {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

// API Response types
export interface UserLifecycleApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedLifecycleResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter types
export interface UserLifecycleFilters {
  stages?: UserLifecycleStage[];
  segments?: UserSegment[];
  journeyPhases?: UserJourneyPhase[];
  registrationDateFrom?: Date;
  registrationDateTo?: Date;
  lastActivityFrom?: Date;
  lastActivityTo?: Date;
  engagementScoreMin?: number;
  engagementScoreMax?: number;
  riskScoreMin?: number;
  riskScoreMax?: number;
  lifetimeValueMin?: number;
  lifetimeValueMax?: number;
  hasReferrals?: boolean;
  positionLevels?: string[];
  searchTerm?: string;
}

export interface LifecycleAnalyticsFilters {
  dateFrom: Date;
  dateTo: Date;
  segments?: UserSegment[];
  cohorts?: string[];
  compareWithPrevious?: boolean;
  groupBy?: "day" | "week" | "month";
}

// Configuration types for dashboard
export interface LifecycleDashboardConfig {
  refreshInterval: number; // minutes
  defaultDateRange: number; // days
  visibleMetrics: DashboardMetric[];
  alertThresholds: AlertThreshold[];
}

export interface DashboardMetric {
  key: string;
  title: string;
  description: string;
  type: MetricType;
  visible: boolean;
  order: number;
}

export enum MetricType {
  COUNT = "COUNT",
  PERCENTAGE = "PERCENTAGE",
  CURRENCY = "CURRENCY",
  DURATION = "DURATION",
  SCORE = "SCORE",
}

export interface AlertThreshold {
  metric: string;
  condition: ConditionOperator;
  value: number;
  severity: AlertSeverity;
  notificationChannels: NotificationChannel[];
}

export enum AlertSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  SLACK = "SLACK",
  WEBHOOK = "WEBHOOK",
  IN_APP = "IN_APP",
}

// Prediction types
export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  riskFactors: RiskFactor[];
  recommendedActions: string[];
  confidenceScore: number;
  predictionDate: Date;
  timeToChurn?: number; // days
}

export interface RiskFactor {
  factor: string;
  weight: number;
  value: number;
  impact: number;
  description: string;
}

export interface LifetimeValuePrediction {
  userId: string;
  predictedLTV: number;
  currentLTV: number;
  potentialUpside: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  keyDrivers: string[];
  predictionHorizon: number; // days
}

// Event tracking types
export interface UserEventContext {
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface UserEventMetadata {
  version: string;
  source: EventSource;
  context: UserEventContext;
  customProperties?: Record<string, any>;
}

// Export utility types
export type UserLifecycleEventType = keyof typeof UserLifecycleEvent;
export type UserLifecycleStageType = keyof typeof UserLifecycleStage;
export type UserSegmentType = keyof typeof UserSegment;
export type UserJourneyPhaseType = keyof typeof UserJourneyPhase;

// Type guards
export const isValidLifecycleStage = (
  stage: string,
): stage is UserLifecycleStage => {
  return Object.values(UserLifecycleStage).includes(
    stage as UserLifecycleStage,
  );
};

export const isValidLifecycleEvent = (
  event: string,
): event is keyof typeof UserLifecycleEvent => {
  return Object.values(UserLifecycleEvent).includes(
    event as UserLifecycleEvent,
  );
};

export const isValidUserSegment = (segment: string): segment is UserSegment => {
  return Object.values(UserSegment).includes(segment as UserSegment);
};

export const isValidJourneyPhase = (
  phase: string,
): phase is UserJourneyPhase => {
  return Object.values(UserJourneyPhase).includes(phase as UserJourneyPhase);
};
