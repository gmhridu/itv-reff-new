import {
  UserLifecycleStage,
  UserLifecycleEvent,
  UserSegment,
  UserJourneyPhase,
  UserLifecycleConfiguration,
  StageTransitionRule,
  TransitionCondition,
  ConditionType,
  ConditionOperator,
  EngagementScoreWeights,
  RiskScoreWeights,
  LifecycleThresholds,
  AutomationSettings,
  MilestoneCategory,
} from "./types";

export const DEFAULT_LIFECYCLE_CONFIG: UserLifecycleConfiguration = {
  stageTransitionRules: [
    // Registration to Profile stages
    {
      fromStage: null,
      toStage: UserLifecycleStage.REGISTERED,
      conditions: [
        {
          type: ConditionType.EVENT_COUNT,
          field: UserLifecycleEvent.USER_REGISTERED,
          operator: ConditionOperator.GREATER_THAN,
          value: 0,
        },
      ],
      priority: 1,
    },
    {
      fromStage: UserLifecycleStage.REGISTERED,
      toStage: UserLifecycleStage.PROFILE_INCOMPLETE,
      conditions: [
        {
          type: ConditionType.USER_PROPERTY,
          field: "name",
          operator: ConditionOperator.NOT_EXISTS,
          value: null,
        },
      ],
      priority: 2,
    },
    {
      fromStage: UserLifecycleStage.PROFILE_INCOMPLETE,
      toStage: UserLifecycleStage.PROFILE_COMPLETE,
      conditions: [
        {
          type: ConditionType.USER_PROPERTY,
          field: "name",
          operator: ConditionOperator.EXISTS,
          value: null,
        },
        {
          type: ConditionType.USER_PROPERTY,
          field: "emailVerified",
          operator: ConditionOperator.EQUALS,
          value: true,
        },
      ],
      priority: 3,
    },

    // First login transition
    {
      fromStage: UserLifecycleStage.PROFILE_COMPLETE,
      toStage: UserLifecycleStage.FIRST_LOGIN,
      conditions: [
        {
          type: ConditionType.EVENT_COUNT,
          field: UserLifecycleEvent.FIRST_LOGIN,
          operator: ConditionOperator.GREATER_THAN,
          value: 0,
        },
      ],
      priority: 4,
    },

    // Onboarding stages
    {
      fromStage: UserLifecycleStage.FIRST_LOGIN,
      toStage: UserLifecycleStage.ONBOARDING_STARTED,
      conditions: [
        {
          type: ConditionType.TIME_BASED,
          field: "lastLoginAt",
          operator: ConditionOperator.LESS_THAN,
          value: 1, // within 1 day
          timeWindow: 1,
        },
      ],
      priority: 5,
    },
    {
      fromStage: UserLifecycleStage.ONBOARDING_STARTED,
      toStage: UserLifecycleStage.ONBOARDING_COMPLETED,
      conditions: [
        {
          type: ConditionType.EVENT_COUNT,
          field: UserLifecycleEvent.BANK_CARD_ADDED,
          operator: ConditionOperator.GREATER_THAN,
          value: 0,
        },
      ],
      priority: 6,
    },

    // Video task engagement
    {
      fromStage: UserLifecycleStage.ONBOARDING_COMPLETED,
      toStage: UserLifecycleStage.FIRST_VIDEO_TASK,
      conditions: [
        {
          type: ConditionType.EVENT_COUNT,
          field: UserLifecycleEvent.FIRST_VIDEO_WATCHED,
          operator: ConditionOperator.GREATER_THAN,
          value: 0,
        },
      ],
      priority: 7,
    },
    {
      fromStage: UserLifecycleStage.FIRST_VIDEO_TASK,
      toStage: UserLifecycleStage.FIRST_EARNING,
      conditions: [
        {
          type: ConditionType.EVENT_COUNT,
          field: UserLifecycleEvent.FIRST_EARNING,
          operator: ConditionOperator.GREATER_THAN,
          value: 0,
        },
      ],
      priority: 8,
    },

    // Regular user progression
    {
      fromStage: UserLifecycleStage.FIRST_EARNING,
      toStage: UserLifecycleStage.REGULAR_USER,
      conditions: [
        {
          type: ConditionType.CALCULATED_METRIC,
          field: "totalVideoTasks",
          operator: ConditionOperator.GREATER_EQUAL,
          value: 5,
        },
        {
          type: ConditionType.TIME_BASED,
          field: "createdAt",
          operator: ConditionOperator.GREATER_THAN,
          value: 3, // 3+ days since registration
          timeWindow: 30,
        },
      ],
      priority: 9,
    },

    // Position upgrade
    {
      fromStage: UserLifecycleStage.REGULAR_USER,
      toStage: UserLifecycleStage.POSITION_UPGRADED,
      conditions: [
        {
          type: ConditionType.EVENT_COUNT,
          field: UserLifecycleEvent.POSITION_UPGRADED,
          operator: ConditionOperator.GREATER_THAN,
          value: 0,
        },
      ],
      priority: 10,
    },

    // Referral stages
    {
      fromStage: UserLifecycleStage.REGULAR_USER,
      toStage: UserLifecycleStage.FIRST_REFERRAL,
      conditions: [
        {
          type: ConditionType.EVENT_COUNT,
          field: UserLifecycleEvent.FIRST_REFERRAL,
          operator: ConditionOperator.GREATER_THAN,
          value: 0,
        },
      ],
      priority: 11,
    },
    {
      fromStage: UserLifecycleStage.FIRST_REFERRAL,
      toStage: UserLifecycleStage.ACTIVE_REFERRER,
      conditions: [
        {
          type: ConditionType.CALCULATED_METRIC,
          field: "totalReferrals",
          operator: ConditionOperator.GREATER_EQUAL,
          value: 5,
        },
      ],
      priority: 12,
    },

    // Engagement levels
    {
      fromStage: UserLifecycleStage.REGULAR_USER,
      toStage: UserLifecycleStage.HIGHLY_ENGAGED,
      conditions: [
        {
          type: ConditionType.CALCULATED_METRIC,
          field: "engagementScore",
          operator: ConditionOperator.GREATER_EQUAL,
          value: 80,
        },
      ],
      priority: 13,
    },
    {
      fromStage: UserLifecycleStage.REGULAR_USER,
      toStage: UserLifecycleStage.MODERATELY_ENGAGED,
      conditions: [
        {
          type: ConditionType.CALCULATED_METRIC,
          field: "engagementScore",
          operator: ConditionOperator.GREATER_EQUAL,
          value: 50,
        },
      ],
      priority: 14,
    },

    // Risk stages
    {
      fromStage: UserLifecycleStage.REGULAR_USER,
      toStage: UserLifecycleStage.AT_RISK,
      conditions: [
        {
          type: ConditionType.TIME_BASED,
          field: "lastLoginAt",
          operator: ConditionOperator.GREATER_THAN,
          value: 7, // 7 days inactive
          timeWindow: 7,
        },
      ],
      priority: 15,
    },
    {
      fromStage: UserLifecycleStage.AT_RISK,
      toStage: UserLifecycleStage.INACTIVE,
      conditions: [
        {
          type: ConditionType.TIME_BASED,
          field: "lastLoginAt",
          operator: ConditionOperator.GREATER_THAN,
          value: 14, // 14 days inactive
          timeWindow: 14,
        },
      ],
      priority: 16,
    },
    {
      fromStage: UserLifecycleStage.INACTIVE,
      toStage: UserLifecycleStage.CHURNED,
      conditions: [
        {
          type: ConditionType.TIME_BASED,
          field: "lastLoginAt",
          operator: ConditionOperator.GREATER_THAN,
          value: 30, // 30 days inactive
          timeWindow: 30,
        },
      ],
      priority: 17,
    },

    // Reactivation
    {
      fromStage: UserLifecycleStage.CHURNED,
      toStage: UserLifecycleStage.REACTIVATED,
      conditions: [
        {
          type: ConditionType.EVENT_COUNT,
          field: UserLifecycleEvent.RETURNED_AFTER_INACTIVITY,
          operator: ConditionOperator.GREATER_THAN,
          value: 0,
        },
      ],
      priority: 18,
    },

    // VIP user
    {
      fromStage: UserLifecycleStage.HIGHLY_ENGAGED,
      toStage: UserLifecycleStage.VIP_USER,
      conditions: [
        {
          type: ConditionType.CALCULATED_METRIC,
          field: "totalEarnings",
          operator: ConditionOperator.GREATER_EQUAL,
          value: 10000,
        },
        {
          type: ConditionType.CALCULATED_METRIC,
          field: "totalReferrals",
          operator: ConditionOperator.GREATER_EQUAL,
          value: 10,
        },
      ],
      priority: 19,
    },
  ],

  engagementScoreWeights: {
    dailyTaskCompletion: 0.3,
    consistencyBonus: 0.2,
    streakMultiplier: 0.15,
    referralActivity: 0.15,
    earningsGrowth: 0.1,
    loginFrequency: 0.1,
  },

  riskScoreWeights: {
    inactivityPenalty: 0.35,
    missedTasksPenalty: 0.2,
    declineInEarnings: 0.15,
    reducedLoginFrequency: 0.15,
    negativeBalance: 0.1,
    supportTickets: 0.05,
  },

  thresholds: {
    engagementScore: {
      high: 80,
      medium: 50,
      low: 25,
    },
    riskScore: {
      high: 75,
      medium: 50,
      low: 25,
    },
    inactivityDays: {
      atRisk: 7,
      inactive: 14,
      churned: 30,
    },
    earningsMilestones: [100, 500, 1000, 5000, 10000, 50000, 100000],
    taskMilestones: [1, 10, 50, 100, 500, 1000, 5000],
    referralMilestones: [1, 5, 10, 25, 50, 100, 500],
  },

  automationSettings: {
    enableStageTransitions: true,
    enableRiskDetection: true,
    enableReengagementCampaigns: true,
    enableMilestoneNotifications: true,

    notifications: {
      stageTransitions: true,
      milestoneAchievements: true,
      riskAlerts: true,
      reengagementTriggers: true,
    },

    campaignTriggers: {
      newUserOnboarding: true,
      inactivityReminders: true,
      milestoneRewards: true,
      winBackCampaigns: true,
    },
  },
};

// Segment definitions and rules
export const SEGMENT_RULES = {
  [UserSegment.NEW_USERS]: {
    stages: [
      UserLifecycleStage.REGISTERED,
      UserLifecycleStage.PROFILE_INCOMPLETE,
      UserLifecycleStage.PROFILE_COMPLETE,
      UserLifecycleStage.FIRST_LOGIN,
    ],
    maxDaysFromRegistration: 7,
  },
  [UserSegment.ACTIVE_USERS]: {
    stages: [
      UserLifecycleStage.REGULAR_USER,
      UserLifecycleStage.MODERATELY_ENGAGED,
      UserLifecycleStage.HIGHLY_ENGAGED,
    ],
    maxDaysFromLastActivity: 7,
  },
  [UserSegment.POWER_USERS]: {
    stages: [UserLifecycleStage.HIGHLY_ENGAGED, UserLifecycleStage.VIP_USER],
    minEngagementScore: 80,
  },
  [UserSegment.AT_RISK_USERS]: {
    stages: [UserLifecycleStage.AT_RISK, UserLifecycleStage.LOW_ENGAGEMENT],
    minRiskScore: 50,
  },
  [UserSegment.CHURNED_USERS]: {
    stages: [UserLifecycleStage.INACTIVE, UserLifecycleStage.CHURNED],
    maxDaysFromLastActivity: 30,
  },
  [UserSegment.HIGH_VALUE_USERS]: {
    minLifetimeValue: 5000,
    stages: [
      UserLifecycleStage.POSITION_UPGRADED,
      UserLifecycleStage.HIGHLY_ENGAGED,
      UserLifecycleStage.VIP_USER,
    ],
  },
  [UserSegment.REFERRAL_CHAMPIONS]: {
    minReferrals: 10,
    stages: [UserLifecycleStage.ACTIVE_REFERRER],
  },
  [UserSegment.TASK_COMPLETERS]: {
    minVideoTasks: 50,
    stages: [
      UserLifecycleStage.REGULAR_USER,
      UserLifecycleStage.MODERATELY_ENGAGED,
      UserLifecycleStage.HIGHLY_ENGAGED,
    ],
  },
  [UserSegment.LOW_ENGAGEMENT]: {
    stages: [UserLifecycleStage.LOW_ENGAGEMENT],
    maxEngagementScore: 25,
  },
  [UserSegment.REACTIVATED_USERS]: {
    stages: [UserLifecycleStage.REACTIVATED],
    maxDaysFromReactivation: 30,
  },
};

// Journey phase mapping
export const JOURNEY_PHASE_MAPPING: Record<
  UserLifecycleStage,
  UserJourneyPhase
> = {
  [UserLifecycleStage.REGISTERED]: UserJourneyPhase.ACQUISITION,
  [UserLifecycleStage.PROFILE_INCOMPLETE]: UserJourneyPhase.ACQUISITION,
  [UserLifecycleStage.PROFILE_COMPLETE]: UserJourneyPhase.ACQUISITION,
  [UserLifecycleStage.FIRST_LOGIN]: UserJourneyPhase.ACTIVATION,
  [UserLifecycleStage.ONBOARDING_STARTED]: UserJourneyPhase.ACTIVATION,
  [UserLifecycleStage.ONBOARDING_COMPLETED]: UserJourneyPhase.ACTIVATION,
  [UserLifecycleStage.FIRST_VIDEO_TASK]: UserJourneyPhase.ACTIVATION,
  [UserLifecycleStage.FIRST_EARNING]: UserJourneyPhase.REVENUE,
  [UserLifecycleStage.REGULAR_USER]: UserJourneyPhase.RETENTION,
  [UserLifecycleStage.POSITION_UPGRADED]: UserJourneyPhase.REVENUE,
  [UserLifecycleStage.FIRST_REFERRAL]: UserJourneyPhase.REFERRAL,
  [UserLifecycleStage.ACTIVE_REFERRER]: UserJourneyPhase.REFERRAL,
  [UserLifecycleStage.HIGHLY_ENGAGED]: UserJourneyPhase.RETENTION,
  [UserLifecycleStage.MODERATELY_ENGAGED]: UserJourneyPhase.RETENTION,
  [UserLifecycleStage.LOW_ENGAGEMENT]: UserJourneyPhase.RETENTION,
  [UserLifecycleStage.AT_RISK]: UserJourneyPhase.CHURN,
  [UserLifecycleStage.INACTIVE]: UserJourneyPhase.CHURN,
  [UserLifecycleStage.CHURNED]: UserJourneyPhase.CHURN,
  [UserLifecycleStage.REACTIVATED]: UserJourneyPhase.REACTIVATION,
  [UserLifecycleStage.VIP_USER]: UserJourneyPhase.RETENTION,
  [UserLifecycleStage.PROBLEM_USER]: UserJourneyPhase.CHURN,
};

// Milestone definitions
export const MILESTONE_DEFINITIONS = [
  // Earnings milestones
  {
    category: MilestoneCategory.EARNINGS,
    name: "First Earnings",
    description: "Earned your first reward",
    threshold: 1,
    event: UserLifecycleEvent.FIRST_EARNING,
  },
  {
    category: MilestoneCategory.EARNINGS,
    name: "Century Club",
    description: "Earned 100 in total rewards",
    threshold: 100,
    event: UserLifecycleEvent.MILESTONE_EARNING,
  },
  {
    category: MilestoneCategory.EARNINGS,
    name: "High Roller",
    description: "Earned 1,000 in total rewards",
    threshold: 1000,
    event: UserLifecycleEvent.MILESTONE_EARNING,
  },
  {
    category: MilestoneCategory.EARNINGS,
    name: "Elite Earner",
    description: "Earned 10,000 in total rewards",
    threshold: 10000,
    event: UserLifecycleEvent.MILESTONE_EARNING,
  },

  // Task milestones
  {
    category: MilestoneCategory.TASKS,
    name: "Getting Started",
    description: "Completed your first video task",
    threshold: 1,
    event: UserLifecycleEvent.VIDEO_TASK_COMPLETED,
  },
  {
    category: MilestoneCategory.TASKS,
    name: "Task Master",
    description: "Completed 100 video tasks",
    threshold: 100,
    event: UserLifecycleEvent.VIDEO_TASK_COMPLETED,
  },
  {
    category: MilestoneCategory.TASKS,
    name: "Video Veteran",
    description: "Completed 1,000 video tasks",
    threshold: 1000,
    event: UserLifecycleEvent.VIDEO_TASK_COMPLETED,
  },

  // Referral milestones
  {
    category: MilestoneCategory.REFERRALS,
    name: "First Referral",
    description: "Referred your first user",
    threshold: 1,
    event: UserLifecycleEvent.FIRST_REFERRAL,
  },
  {
    category: MilestoneCategory.REFERRALS,
    name: "Network Builder",
    description: "Referred 10 users",
    threshold: 10,
    event: UserLifecycleEvent.REFERRAL_MILESTONE,
  },
  {
    category: MilestoneCategory.REFERRALS,
    name: "Referral Champion",
    description: "Referred 50 users",
    threshold: 50,
    event: UserLifecycleEvent.REFERRAL_MILESTONE,
  },

  // Streak milestones
  {
    category: MilestoneCategory.STREAK,
    name: "Week Warrior",
    description: "Maintained a 7-day task streak",
    threshold: 7,
    event: UserLifecycleEvent.STREAK_MILESTONE,
  },
  {
    category: MilestoneCategory.STREAK,
    name: "Month Master",
    description: "Maintained a 30-day task streak",
    threshold: 30,
    event: UserLifecycleEvent.STREAK_MILESTONE,
  },

  // Engagement milestones
  {
    category: MilestoneCategory.ENGAGEMENT,
    name: "Highly Engaged",
    description: "Achieved high engagement score",
    threshold: 80,
    event: UserLifecycleEvent.DAILY_TASK_GOAL_ACHIEVED,
  },
];

// Risk factor definitions
export const RISK_FACTORS = {
  INACTIVITY: {
    name: "Inactivity",
    description: "User hasn't logged in recently",
    weight: 0.35,
    thresholds: {
      low: 3, // days
      medium: 7,
      high: 14,
    },
  },
  MISSED_TASKS: {
    name: "Missed Tasks",
    description: "User is missing daily task targets",
    weight: 0.2,
    thresholds: {
      low: 0.1, // 10% miss rate
      medium: 0.3, // 30% miss rate
      high: 0.5, // 50% miss rate
    },
  },
  DECLINING_EARNINGS: {
    name: "Declining Earnings",
    description: "User's earnings are decreasing over time",
    weight: 0.15,
    thresholds: {
      low: -0.1, // 10% decline
      medium: -0.3, // 30% decline
      high: -0.5, // 50% decline
    },
  },
  REDUCED_LOGIN_FREQUENCY: {
    name: "Reduced Login Frequency",
    description: "User is logging in less frequently",
    weight: 0.15,
    thresholds: {
      low: -0.2, // 20% reduction
      medium: -0.5, // 50% reduction
      high: -0.8, // 80% reduction
    },
  },
  NEGATIVE_BALANCE: {
    name: "Negative Balance",
    description: "User has a negative wallet balance",
    weight: 0.1,
    thresholds: {
      low: -10,
      medium: -100,
      high: -500,
    },
  },
  SUPPORT_ISSUES: {
    name: "Support Issues",
    description: "User has multiple support tickets",
    weight: 0.05,
    thresholds: {
      low: 1,
      medium: 3,
      high: 5,
    },
  },
};

// Campaign trigger configurations
export const CAMPAIGN_TRIGGERS = {
  NEW_USER_ONBOARDING: {
    stages: [UserLifecycleStage.REGISTERED, UserLifecycleStage.PROFILE_INCOMPLETE],
    delay: 0, // immediate
    maxTriggers: 3,
    messages: [
      {
        title: "Welcome to the platform!",
        body: "Complete your profile to get started",
        action: "Complete Profile",
      },
      {
        title: "Don't forget to verify your email",
        body: "Verify your email to unlock all features",
        action: "Verify Email",
      },
    ],
  },
  INACTIVITY_REMINDER: {
    stages: [UserLifecycleStage.AT_RISK],
    delay: 1, // 1 day
    maxTriggers: 2,
    messages: [
      {
        title: "We miss you!",
        body: "Come back and complete your daily tasks",
        action: "View Tasks",
      },
    ],
  },
  WIN_BACK_CAMPAIGN: {
    stages: [UserLifecycleStage.CHURNED],
    delay: 7, // 7 days
    maxTriggers: 1,
    messages: [
      {
        title: "Special offer just for you",
        body: "We have new videos and higher rewards waiting",
        action: "Come Back",
      },
    ],
  },
  MILESTONE_CELEBRATION: {
    events: [
      UserLifecycleEvent.MILESTONE_EARNING,
      UserLifecycleEvent.REFERRAL_MILESTONE,
      UserLifecycleEvent.STREAK_MILESTONE,
    ],
    delay: 0, // immediate
    maxTriggers: 999, // unlimited
  },
};
