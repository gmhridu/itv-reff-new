// Mock data for admin dashboard components
import { UserStatus, VideoStatus, AnalyticsTimeRange, AdminRole, VideoUploadMethod } from '@/types/admin-enums';

// Data for global state store
export const mockStore = {
  adminUser: {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'SUPER_ADMIN' as const,
    lastLogin: '2024-01-15T10:30:00Z'
  },
  isAuthenticated: true
};

// Data returned by API queries
export const mockQuery = {
  analyticsData: {
    userIncomeData: [
      { month: 'Jan', income: 15420, users: 1250 },
      { month: 'Feb', income: 18650, users: 1380 },
      { month: 'Mar', income: 22100, users: 1520 },
      { month: 'Apr', income: 19800, users: 1450 },
      { month: 'May', income: 25600, users: 1680 },
      { month: 'Jun', income: 28900, users: 1820 }
    ],
    videoMetrics: {
      totalViews: 125600,
      averageWatchTime: 245,
      engagementRate: 78.5,
      topVideos: [
        { id: 'v1', title: 'How to Earn More', views: 8500, earnings: 1200 },
        { id: 'v2', title: 'Platform Guide', views: 7200, earnings: 980 },
        { id: 'v3', title: 'Success Stories', views: 6800, earnings: 850 }
      ]
    },
    userGrowth: [
      { date: '2024-01-01', newUsers: 45, totalUsers: 1200 },
      { date: '2024-01-02', newUsers: 52, totalUsers: 1252 },
      { date: '2024-01-03', newUsers: 38, totalUsers: 1290 },
      { date: '2024-01-04', newUsers: 61, totalUsers: 1351 },
      { date: '2024-01-05', newUsers: 43, totalUsers: 1394 }
    ],
    revenueData: {
      totalRevenue: 185600,
      monthlyRevenue: 28900,
      revenueGrowth: 12.5,
      revenueBySource: [
        { source: 'Video Rewards', amount: 145200, percentage: 78.2 },
        { source: 'Referral Bonuses', amount: 28400, percentage: 15.3 },
        { source: 'Premium Features', amount: 12000, percentage: 6.5 }
      ]
    }
  },
  usersData: {
    users: [
      {
        id: 'u1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'ACTIVE' as const,
        registrationDate: '2024-01-10T08:00:00Z',
        lastLogin: '2024-01-15T14:30:00Z',
        totalEarnings: 245.50,
        videosWatched: 128,
        referrals: 5
      },
      {
        id: 'u2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        status: 'BLOCKED' as const,
        registrationDate: '2024-01-08T12:15:00Z',
        lastLogin: '2024-01-14T09:45:00Z',
        totalEarnings: 189.25,
        videosWatched: 95,
        referrals: 3
      },
      {
        id: 'u3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        status: 'ACTIVE' as const,
        registrationDate: '2024-01-12T16:20:00Z',
        lastLogin: '2024-01-15T11:10:00Z',
        totalEarnings: 156.75,
        videosWatched: 78,
        referrals: 2
      }
    ],
    totalUsers: 1820,
    activeUsers: 1654,
    blockedUsers: 166
  },
  videosData: {
    videos: [
      {
        id: 'v1',
        title: 'Getting Started Guide',
        description: 'Complete guide for new users',
        status: 'APPROVED' as const,
        uploadDate: '2024-01-10T10:00:00Z',
        views: 8500,
        duration: 180,
        earnings: 1200,
        uploadMethod: 'FILE_UPLOAD' as const
      },
      {
        id: 'v2',
        title: 'Advanced Tips',
        description: 'Tips for experienced users',
        status: 'PENDING' as const,
        uploadDate: '2024-01-14T15:30:00Z',
        views: 0,
        duration: 240,
        earnings: 0,
        uploadMethod: 'YOUTUBE_EMBED' as const
      }
    ],
    totalVideos: 156,
    pendingReview: 12,
    approvedVideos: 144
  }
};

// Data passed as props to the root component
export const mockRootProps = {
  initialTimeRange: 'MONTHLY' as const,
  pageSize: 10,
  allowedFileTypes: ['.mp4', '.avi', '.mov', '.wmv'],
  maxFileSize: 104857600, // 100MB
  youtubeEmbedEnabled: true
};