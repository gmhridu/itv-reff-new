# User Lifecycle Service

A comprehensive user lifecycle tracking and analytics system that monitors user journey progression, engagement patterns, and behavior analytics throughout their entire lifecycle on the platform.

## Overview

The User Lifecycle Service provides:
- **Complete user journey tracking** from registration to churn/reactivation
- **Real-time lifecycle stage transitions** based on configurable rules
- **Advanced analytics and insights** for user behavior patterns
- **Automated milestone detection** and reward tracking
- **Churn prediction** and retention analytics
- **Comprehensive reporting** with export capabilities

## Architecture

The service consists of several key components:

### Core Components

1. **Event Tracking System** (`event-tracking.ts`)
   - Tracks all user lifecycle events
   - Manages stage transitions
   - Stores event history with context

2. **Lifecycle Service** (`service.ts`)
   - Main service for lifecycle data management
   - User segmentation and analytics
   - Stage management and transitions

3. **Analytics Service** (`analytics.ts`)
   - Dashboard metrics and insights
   - Cohort analysis and retention tracking
   - Journey funnel analysis

4. **Integration Layer** (`integrations.ts`)
   - Hooks for existing application events
   - Automated milestone checking
   - Daily lifecycle monitoring

## User Lifecycle Stages

The system tracks users through the following stages:

### Initial Stages
- `REGISTERED` - User has created an account
- `PROFILE_INCOMPLETE` - Profile setup in progress
- `PROFILE_COMPLETE` - Profile fully completed

### Onboarding Stages
- `FIRST_LOGIN` - User's first login session
- `ONBOARDING_STARTED` - Onboarding process initiated
- `ONBOARDING_COMPLETED` - Onboarding fully completed

### Engagement Stages
- `FIRST_VIDEO_TASK` - First video task completed
- `FIRST_EARNING` - First reward earned
- `REGULAR_USER` - Consistent platform usage

### Growth Stages
- `POSITION_UPGRADED` - Upgraded to higher position
- `FIRST_REFERRAL` - Made first referral
- `ACTIVE_REFERRER` - Multiple successful referrals

### Retention Stages
- `HIGHLY_ENGAGED` - High engagement score (80+)
- `MODERATELY_ENGAGED` - Medium engagement score (50-80)
- `LOW_ENGAGEMENT` - Low engagement score (<50)

### Risk Stages
- `AT_RISK` - Showing signs of potential churn
- `INACTIVE` - No activity for extended period
- `CHURNED` - Considered churned user

### Recovery Stages
- `REACTIVATED` - Returned after inactivity

### Special Stages
- `VIP_USER` - High-value user status
- `PROBLEM_USER` - Requiring special attention

## User Segments

Users are automatically categorized into behavioral segments:

- `NEW_USERS` - Recently registered users
- `ACTIVE_USERS` - Regular platform users
- `POWER_USERS` - Highly engaged users
- `AT_RISK_USERS` - Users showing churn signals
- `CHURNED_USERS` - Inactive users
- `HIGH_VALUE_USERS` - High lifetime value
- `REFERRAL_CHAMPIONS` - Top referrers
- `TASK_COMPLETERS` - Task-focused users
- `LOW_ENGAGEMENT` - Low activity users
- `REACTIVATED_USERS` - Recently returned users

## Installation and Setup

### 1. Import Required Services

```typescript
import { 
  userLifecycleService, 
  eventTracker, 
  trackUserEvent 
} from '@/lib/user-lifecycle';
```

### 2. Initialize Event Tracking

Add lifecycle event tracking to your existing user actions:

```typescript
// User registration
import { trackUserRegistration } from '@/lib/user-lifecycle/integrations';

await trackUserRegistration(userId, {
  email: user.email,
  phone: user.phone,
  referralCode: user.referralCode,
  ipAddress: request.ip,
  userAgent: request.headers['user-agent']
});

// Video task completion
import { trackVideoTaskCompleted } from '@/lib/user-lifecycle/integrations';

await trackVideoTaskCompleted(userId, {
  videoId: task.videoId,
  rewardEarned: task.reward,
  watchDuration: task.duration,
  isFirstVideo: isFirstVideo
});
```

### 3. Set Up Daily Monitoring

Add to your cron job or scheduled task:

```typescript
import { runDailyLifecycleCheck } from '@/lib/user-lifecycle/integrations';

// Run daily at midnight
await runDailyLifecycleCheck();
```

## API Endpoints

### User Lifecycle Data

```
GET /api/admin/lifecycle/users
GET /api/admin/lifecycle/users/{userId}
PATCH /api/admin/lifecycle/users/{userId}
POST /api/admin/lifecycle/users (bulk operations)
```

### Analytics Dashboard

```
GET /api/admin/lifecycle/analytics?type=dashboard
GET /api/admin/lifecycle/analytics?type=heatmap
GET /api/admin/lifecycle/analytics?type=journey
GET /api/admin/lifecycle/analytics?type=cohort
GET /api/admin/lifecycle/analytics?type=insights
```

### Reports

```
GET /api/admin/lifecycle/reports
POST /api/admin/lifecycle/reports (custom reports)
```

## Usage Examples

### Get User Lifecycle Data

```typescript
const lifecycleData = await userLifecycleService.getUserLifecycleData(userId);

console.log('Current stage:', lifecycleData.currentStage);
console.log('Engagement score:', lifecycleData.engagementScore);
console.log('Risk score:', lifecycleData.riskScore);
console.log('Segment:', lifecycleData.segment);
```

### Track Custom Event

```typescript
await trackUserEvent(
  userId,
  UserLifecycleEvent.VIDEO_TASK_COMPLETED,
  {
    videoId: 'video-123',
    rewardEarned: 25,
    completionTime: 45
  },
  EventSource.USER_ACTION
);
```

### Generate Analytics Report

```typescript
const report = await userLifecycleService.generateLifecycleReport(
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  {
    segments: [UserSegment.ACTIVE_USERS, UserSegment.POWER_USERS],
    stages: [UserLifecycleStage.HIGHLY_ENGAGED]
  }
);
```

### Get Dashboard Metrics

```typescript
import { userLifecycleAnalyticsService } from '@/lib/user-lifecycle';

const metrics = await userLifecycleAnalyticsService.getDashboardMetrics({
  dateFrom: new Date('2024-01-01'),
  dateTo: new Date('2024-01-31'),
  groupBy: 'day'
});
```

## Configuration

### Stage Transition Rules

Customize stage transition logic in `config.ts`:

```typescript
const customRules: StageTransitionRule[] = [
  {
    fromStage: UserLifecycleStage.REGISTERED,
    toStage: UserLifecycleStage.PROFILE_COMPLETE,
    conditions: [
      {
        type: ConditionType.USER_PROPERTY,
        field: 'name',
        operator: ConditionOperator.EXISTS,
        value: null
      }
    ],
    priority: 1
  }
];
```

### Engagement Score Weights

Adjust engagement calculation weights:

```typescript
const engagementWeights: EngagementScoreWeights = {
  dailyTaskCompletion: 0.3,
  consistencyBonus: 0.2,
  streakMultiplier: 0.15,
  referralActivity: 0.15,
  earningsGrowth: 0.1,
  loginFrequency: 0.1
};
```

### Risk Score Configuration

Configure risk detection parameters:

```typescript
const riskWeights: RiskScoreWeights = {
  inactivityPenalty: 0.35,
  missedTasksPenalty: 0.2,
  declineInEarnings: 0.15,
  reducedLoginFrequency: 0.15,
  negativeBalance: 0.1,
  supportTickets: 0.05
};
```

## React Components

### Lifecycle Dashboard

```tsx
import LifecycleDashboard from '@/components/admin/lifecycle/LifecycleDashboard';

function AdminPage() {
  return <LifecycleDashboard />;
}
```

The dashboard provides:
- Overview metrics cards
- Stage and segment distributions
- Journey analytics
- Actionable insights
- Trend visualizations

## Database Schema Integration

The service integrates with existing Prisma models:

- `User` - Main user data and relationships
- `ActivityLog` - Event tracking and stage transitions
- `SystemLog` - Error logging and system events
- `UserVideoTask` - Task completion tracking
- `WalletTransaction` - Financial activity tracking

## Monitoring and Alerts

### Daily Health Checks

The service runs automated daily checks for:
- Inactive user detection
- Missed daily targets
- Engagement score updates
- Churn risk assessment

### Performance Monitoring

Key metrics to monitor:
- Event tracking latency
- Stage transition accuracy
- Analytics query performance
- Report generation time

## Troubleshooting

### Common Issues

1. **Events not tracking**
   - Check database connection
   - Verify user exists
   - Check event payload format

2. **Stage transitions not working**
   - Review transition rules
   - Check condition evaluation
   - Verify user data completeness

3. **Analytics slow performance**
   - Add database indexes
   - Optimize date range queries
   - Consider data archiving

### Debugging

Enable debug logging:

```typescript
process.env.LIFECYCLE_DEBUG = 'true';
```

Check system logs:

```typescript
const logs = await prisma.systemLog.findMany({
  where: { component: 'UserLifecycleService' },
  orderBy: { createdAt: 'desc' },
  take: 100
});
```

## Best Practices

1. **Event Tracking**
   - Always include context data
   - Use appropriate event sources
   - Handle errors gracefully

2. **Performance**
   - Batch bulk operations
   - Use database indexes effectively
   - Cache frequently accessed data

3. **Privacy**
   - Anonymize sensitive data in analytics
   - Follow data retention policies
   - Implement proper access controls

4. **Testing**
   - Test stage transition logic
   - Validate analytics calculations
   - Monitor data accuracy

## Contributing

When extending the lifecycle service:

1. Add new events to the `UserLifecycleEvent` enum
2. Update stage transition rules as needed
3. Add appropriate analytics tracking
4. Update documentation and tests

## Support

For issues and questions:
- Check system logs for errors
- Review configuration settings
- Validate data integrity
- Test with sample data

The User Lifecycle Service provides comprehensive insights into user behavior and journey progression, enabling data-driven decisions for user engagement and retention strategies.