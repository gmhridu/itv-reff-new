// Admin-related enums for the dashboard system

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export enum VideoUploadMethod {
  FILE_UPLOAD = 'FILE_UPLOAD',
  YOUTUBE_EMBED = 'YOUTUBE_EMBED'
}

export enum VideoStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING'
}

export enum AnalyticsTimeRange {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM'
}

export enum ChartType {
  LINE = 'LINE',
  BAR = 'BAR',
  PIE = 'PIE',
  AREA = 'AREA'
}

export enum SettingsCategory {
  SYSTEM = 'SYSTEM',
  USER_PERMISSIONS = 'USER_PERMISSIONS',
  CONTENT_MODERATION = 'CONTENT_MODERATION',
  NOTIFICATIONS = 'NOTIFICATIONS',
  API_CONFIGURATION = 'API_CONFIGURATION'
}