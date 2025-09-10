import {
  AdminRole,
  UserStatus,
  TransactionType,
  TransactionStatus,
  WithdrawalStatus,
} from "@prisma/client";

// Admin User Types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export { AdminRole };

// Analytics Types
export interface AnalyticsOverview {
  totalRevenue: number;
  revenueGrowth: number;
  totalUsers: number;
  userGrowth: number;
  totalVideoViews: number;
  videoViewGrowth: number;
  activeUsers: number;
  activeUserChange: number;
}

export interface AnalyticsTimeSeriesData {
  name: string;
  value: number;
  date?: string;
}

export interface UserIncomeAnalytics {
  monthly: AnalyticsTimeSeriesData[];
  weekly: AnalyticsTimeSeriesData[];
  yearly: AnalyticsTimeSeriesData[];
}

export interface VideoViewsAnalytics {
  weekly: AnalyticsTimeSeriesData[];
  monthly: AnalyticsTimeSeriesData[];
  daily: AnalyticsTimeSeriesData[];
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  userIncome: UserIncomeAnalytics;
  videoViews: VideoViewsAnalytics;
  topVideos: VideoAnalytics[];
  topUsers: UserAnalytics[];
  revenueBreakdown: RevenueBreakdown[];
}

export interface RevenueBreakdown {
  source: string;
  amount: number;
  percentage: number;
}

// User Management Types
export interface UserManagement {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar?: string;
  registrationDate: Date;
  lastLogin: Date | null;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  referralCode: string;
  referredBy: string | null;
  walletBalance: number;
  totalEarnings: number;
  currentPosition: string | null;
  positionLevel: string | null;
  engagement: number; // 0-100 score
  totalVideosTasks: number;
  totalReferrals: number;
  ipAddress: string | null;
  deviceId: string | null;
  isIntern: boolean;
  depositPaid: number;
}

export { UserStatus };

export interface UserAnalytics {
  id: string;
  name: string;
  email: string;
  totalEarnings: number;
  videoTasksCompleted: number;
  referralCount: number;
  engagement: number;
}

export interface UserFilters {
  status?: UserStatus;
  positionLevel?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  isIntern?: boolean;
  hasReferrals?: boolean;
}

export interface PaginatedUsers {
  users: UserManagement[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Video Management Types
export interface VideoManagement {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  duration: number;
  rewardAmount: number;
  isActive: boolean;
  availableFrom: Date | null;
  availableTo: Date | null;
  positionLevelId: string | null;
  positionLevel: PositionLevelInfo | null;
  createdAt: Date;
  updatedAt: Date;
  totalViews: number;
  totalRewardsPaid: number;
  averageWatchDuration: number;
  uploadMethod: "file" | "youtube";
  youtubeVideoId?: string | null;
  cloudinaryPublicId?: string | null;
  tags: string[];
}

export interface PositionLevelInfo {
  id: string;
  name: string;
  level: number;
  deposit: number;
  tasksPerDay: number;
  unitPrice: number;
}

export interface VideoAnalytics {
  id: string;
  title: string;
  views: number;
  engagement: number;
  totalRewardsPaid: number;
  averageWatchTime: number;
  completionRate: number;
}

export interface VideoUploadData {
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  rewardAmount: number;
  positionLevelId?: string;
  availableFrom?: Date;
  availableTo?: Date;
  isActive?: boolean;
  uploadMethod?: "file" | "youtube";
  youtubeVideoId?: string;
  cloudinaryPublicId?: string;
  tags?: string[];
}

export interface VideoFilters {
  isActive?: boolean;
  positionLevelId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

// Settings Types
export interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  referralSystemEnabled: boolean;
  minimumWithdrawal: number;
  maxDailyWithdrawals: number;
  videoWatchTimeThreshold: number; // minimum watch time percentage for reward
  sessionTimeout: number; // in minutes
}

export interface PermissionSettings {
  defaultUserRole: string;
  autoApproveUsers: boolean;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  maxReferralLevels: number;
}

export interface ContentSettings {
  autoApproveComments: boolean;
  maxVideoFileSize: number; // in MB
  allowedVideoFormats: string[];
  autoGenerateThumbnails: boolean;
  contentModerationEnabled: boolean;
}

export interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  adminEmailNotifications: boolean;
  userWelcomeEmails: boolean;
  withdrawalNotifications: boolean;
}

export interface ApiSettings {
  apiKey: string;
  rateLimitEnabled: boolean;
  maxRequestsPerHour: number;
  webhookUrl: string | null;
  analyticsIntegration: boolean;
}

export interface AllSettings {
  system: SystemSettings;
  permissions: PermissionSettings;
  content: ContentSettings;
  notifications: NotificationSettings;
  api: ApiSettings;
}

export type SettingCategory =
  | "system"
  | "permissions"
  | "content"
  | "notifications"
  | "api";

export interface SettingItem {
  key: string;
  value: any;
  category: SettingCategory;
  description?: string;
  type: "string" | "number" | "boolean" | "array" | "object";
}

// Withdrawal Management Types
export interface WithdrawalRequestManagement {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  paymentMethod: string;
  paymentDetails: any;
  status: WithdrawalStatus;
  adminNotes: string | null;
  processedAt: Date | null;
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export { WithdrawalStatus };

// Transaction Types
export interface TransactionManagement {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  status: TransactionStatus;
  metadata: any;
  createdAt: Date;
}

export { TransactionType, TransactionStatus };

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalVideos: number;
  totalVideoViews: number;
  totalRevenue: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  averageUserEarnings: number;
  topPerformingVideo: {
    id: string;
    title: string;
    views: number;
  } | null;
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type:
    | "user_registration"
    | "video_upload"
    | "withdrawal_request"
    | "video_task_completed";
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

// Form Types
export interface UserUpdateForm {
  name?: string;
  email?: string;
  phone?: string;
  status?: UserStatus;
  walletBalance?: number;
  currentPositionId?: string;
}

export interface VideoUploadForm {
  title: string;
  description?: string;
  url?: string;
  youtubeUrl?: string;
  duration: number;
  rewardAmount: number;
  positionLevelId?: string;
  availableFrom?: string;
  availableTo?: string;
  isActive?: boolean;
  uploadMethod: "file" | "youtube";
  file?: File;
  tags?: string;
  thumbnail?: File;
}

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  duration?: number;
  format: string;
  bytes: number;
  width: number;
  height: number;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  embedUrl: string;
}

export interface AdminLoginForm {
  email: string;
  password: string;
}

export interface SettingsUpdateForm {
  [key: string]: any;
}

// Backward compatibility exports
export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  registrationDate: string;
  lastLogin: string;
  status: "active" | "blocked";
  engagement: number;
};

export type Video = {
  id: string;
  title: string;
  description: string;
  url: string;
  uploadDate: string;
  views: number;
  engagement: number;
};
