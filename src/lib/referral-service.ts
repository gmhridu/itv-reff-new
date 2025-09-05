import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export interface ReferralTrackingData {
  referralCode: string;
  ipAddress: string;
  userAgent: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface ReferralReward {
  id: string;
  name: string;
  triggerEvent: string;
  rewardAmount: number;
  isActive: boolean;
}

export class ReferralService {
  
  // Track referral click/visit
  static async trackReferralVisit(data: ReferralTrackingData): Promise<{ success: boolean; activityId?: string }> {
    try {
      // Find the referrer by referral code
      const referrer = await db.user.findUnique({
        where: { referralCode: data.referralCode },
        select: { id: true, status: true }
      });

      if (!referrer || referrer.status !== 'ACTIVE') {
        return { success: false };
      }

      // Check if there's already a recent activity from this IP
      const existingActivity = await db.referralActivity.findFirst({
        where: {
          referrerId: referrer.id,
          referralCode: data.referralCode,
          ipAddress: data.ipAddress,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
          }
        }
      });

      if (existingActivity) {
        return { success: true, activityId: existingActivity.id };
      }

      // Create new referral activity
      const activity = await db.referralActivity.create({
        data: {
          referrerId: referrer.id,
          referralCode: data.referralCode,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          source: data.source,
          status: 'PENDING',
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      });

      return { success: true, activityId: activity.id };
    } catch (error) {
      console.error('Error tracking referral visit:', error);
      return { success: false };
    }
  }

  // Process referral registration
  static async processReferralRegistration(
    referralCode: string, 
    newUserId: string, 
    ipAddress: string
  ): Promise<{ success: boolean; rewardAmount?: number }> {
    try {
      // Find the referrer
      const referrer = await db.user.findUnique({
        where: { referralCode },
        select: { id: true, status: true }
      });

      if (!referrer || referrer.status !== 'ACTIVE') {
        return { success: false };
      }

      // Update or create referral activity
      const activity = await db.referralActivity.findFirst({
        where: {
          referrerId: referrer.id,
          referralCode,
          ipAddress,
          status: 'PENDING'
        }
      });

      if (activity) {
        await db.referralActivity.update({
          where: { id: activity.id },
          data: {
            referredUserId: newUserId,
            status: 'REGISTERED'
          }
        });
      } else {
        await db.referralActivity.create({
          data: {
            referrerId: referrer.id,
            referredUserId: newUserId,
            referralCode,
            ipAddress,
            userAgent: 'registration',
            source: 'direct',
            status: 'REGISTERED'
          }
        });
      }

      // Check for registration rewards
      const registrationReward = await this.getActiveReward('registration');
      if (registrationReward) {
        await this.awardReferralReward(referrer.id, newUserId, registrationReward, 'registration');
        return { success: true, rewardAmount: registrationReward.rewardAmount };
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing referral registration:', error);
      return { success: false };
    }
  }

  // Process referral qualification (e.g., first video watch)
  static async processReferralQualification(
    userId: string, 
    event: string
  ): Promise<{ success: boolean; rewardAmount?: number }> {
    try {
      // Find user's referral activity
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { referredBy: true }
      });

      if (!user?.referredBy) {
        return { success: false };
      }

      // Find the referral activity
      const activity = await db.referralActivity.findFirst({
        where: {
          referrerId: user.referredBy,
          referredUserId: userId,
          status: 'REGISTERED'
        }
      });

      if (!activity) {
        return { success: false };
      }

      // Check for event-specific rewards
      const reward = await this.getActiveReward(event);
      if (reward) {
        await db.referralActivity.update({
          where: { id: activity.id },
          data: { status: 'QUALIFIED' }
        });

        await this.awardReferralReward(user.referredBy, userId, reward, event);
        return { success: true, rewardAmount: reward.rewardAmount };
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing referral qualification:', error);
      return { success: false };
    }
  }

  // Award referral reward
  private static async awardReferralReward(
    referrerId: string,
    referredUserId: string,
    reward: ReferralReward,
    event: string
  ): Promise<void> {
    try {
      // Get referred user info for transaction description
      const referredUser = await db.user.findUnique({
        where: { id: referredUserId },
        select: { name: true, email: true }
      });

      // Update referrer's balance
      await db.user.update({
        where: { id: referrerId },
        data: {
          walletBalance: { increment: reward.rewardAmount },
          totalEarnings: { increment: reward.rewardAmount }
        }
      });

      // Get updated balance for transaction record
      const updatedReferrer = await db.user.findUnique({
        where: { id: referrerId },
        select: { walletBalance: true }
      });

      // Create transaction record
      await db.walletTransaction.create({
        data: {
          userId: referrerId,
          type: 'CREDIT',
          amount: reward.rewardAmount,
          balanceAfter: updatedReferrer!.walletBalance,
          description: `${reward.name}: ${referredUser?.name || referredUser?.email} completed ${event}`,
          referenceId: `REFERRAL_${event.toUpperCase()}_${referredUserId}_${Date.now()}`,
          status: 'COMPLETED',
          metadata: JSON.stringify({
            rewardId: reward.id,
            referredUserId,
            event
          })
        }
      });

      // Update referral activity
      await db.referralActivity.updateMany({
        where: {
          referrerId,
          referredUserId,
          status: 'QUALIFIED'
        },
        data: {
          status: 'REWARDED',
          rewardAmount: reward.rewardAmount,
          rewardPaidAt: new Date()
        }
      });

      // Update reward usage count
      await db.referralReward.update({
        where: { id: reward.id },
        data: { currentRewards: { increment: 1 } }
      });

    } catch (error) {
      console.error('Error awarding referral reward:', error);
      throw error;
    }
  }

  // Get active reward for event
  private static async getActiveReward(event: string): Promise<ReferralReward | null> {
    try {
      const reward = await db.referralReward.findFirst({
        where: {
          triggerEvent: event,
          isActive: true,
          validFrom: { lte: new Date() },
          AND: [
            {
              OR: [
                { validUntil: null },
                { validUntil: { gte: new Date() } }
              ]
            },
            {
              OR: [
                { maxRewards: null },
                { currentRewards: { lt: db.referralReward.fields.maxRewards } }
              ]
            }
          ]
        }
      });

      return reward;
    } catch (error) {
      console.error('Error getting active reward:', error);
      return null;
    }
  }

  // Generate referral link
  static generateReferralLink(referralCode: string, baseUrl?: string): string {
    const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${url}/register?ref=${referralCode}`;
  }

  // Generate social sharing links
  static generateSocialLinks(referralCode: string, baseUrl?: string): Record<string, string> {
    const referralLink = this.generateReferralLink(referralCode, baseUrl);
    const message = encodeURIComponent(`Join me on VideoTask and start earning money by watching videos! Use my referral link: ${referralLink}`);
    
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${message}`,
      whatsapp: `https://wa.me/?text=${message}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on VideoTask and start earning!')}`,
      email: `mailto:?subject=${encodeURIComponent('Join VideoTask and Earn Money!')}&body=${message}`,
      copy: referralLink
    };
  }

  // Get referral statistics
  static async getReferralStats(userId: string): Promise<any> {
    try {
      const [activities, totalRewards, monthlyStats] = await Promise.all([
        // Get all referral activities
        db.referralActivity.findMany({
          where: { referrerId: userId },
          orderBy: { createdAt: 'desc' }
        }).catch(() => []), // Return empty array if table doesn't exist yet

        // Get total rewards earned
        db.walletTransaction.aggregate({
          where: {
            userId,
            description: { contains: 'Referral' },
            type: 'CREDIT'
          },
          _sum: { amount: true },
          _count: true
        }).catch(() => ({ _sum: { amount: 0 }, _count: 0 })), // Return default if fails

        // Get monthly statistics
        db.referralActivity.groupBy({
          by: ['status'],
          where: {
            referrerId: userId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          _count: true
        }).catch(() => []) // Return empty array if fails
      ]);

      return {
        totalReferrals: activities?.length || 0,
        registeredReferrals: activities?.filter(a => ['REGISTERED', 'QUALIFIED', 'REWARDED'].includes(a.status)).length || 0,
        qualifiedReferrals: activities?.filter(a => ['QUALIFIED', 'REWARDED'].includes(a.status)).length || 0,
        rewardedReferrals: activities?.filter(a => a.status === 'REWARDED').length || 0,
        totalEarnings: totalRewards?._sum?.amount || 0,
        monthlyReferrals: monthlyStats?.reduce((sum, stat) => sum + stat._count, 0) || 0,
        activities: activities?.map(activity => ({
          id: activity.id,
          status: activity.status,
          source: activity.source || 'unknown',
          rewardAmount: activity.rewardAmount || 0,
          createdAt: activity.createdAt.toISOString(),
          rewardPaidAt: activity.rewardPaidAt?.toISOString() || null
        })) || []
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      // Return default stats instead of null
      return {
        totalReferrals: 0,
        registeredReferrals: 0,
        qualifiedReferrals: 0,
        rewardedReferrals: 0,
        totalEarnings: 0,
        monthlyReferrals: 0,
        activities: []
      };
    }
  }
}
