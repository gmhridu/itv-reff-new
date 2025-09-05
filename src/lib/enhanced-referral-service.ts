import { db } from '@/lib/db';
import { ReferralLevel } from '@prisma/client';

export interface ReferralRewardRates {
  P1: { A: 312, B: 117, C: 39 };
  P2: { A: 1440, B: 540, C: 180 };
  P3: { A: 4160, B: 1560, C: 520 };
  P4: { A: 9600, B: 3600, C: 1200 };
  P5: { A: 20000, B: 7500, C: 2500 };
  P6: { A: 44000, B: 16500, C: 5500 };
  P7: { A: 88000, B: 33000, C: 11000 };
  P8: { A: 176000, B: 66000, C: 22000 };
  P9: { A: 320000, B: 120000, C: 40000 };
  P10: { A: 560000, B: 210000, C: 70000 };
}

export interface ThreeTierRewardResult {
  success: boolean;
  totalRewardsDistributed: number;
  rewardsBreakdown: {
    aLevel?: { userId: string; amount: number; positionName: string };
    bLevel?: { userId: string; amount: number; positionName: string };
    cLevel?: { userId: string; amount: number; positionName: string };
  };
}

export class EnhancedReferralService {
  
  private static readonly REWARD_RATES: ReferralRewardRates = {
    P1: { A: 312, B: 117, C: 39 },
    P2: { A: 1440, B: 540, C: 180 },
    P3: { A: 4160, B: 1560, C: 520 },
    P4: { A: 9600, B: 3600, C: 1200 },
    P5: { A: 20000, B: 7500, C: 2500 },
    P6: { A: 44000, B: 16500, C: 5500 },
    P7: { A: 88000, B: 33000, C: 11000 },
    P8: { A: 176000, B: 66000, C: 22000 },
    P9: { A: 320000, B: 120000, C: 40000 },
    P10: { A: 560000, B: 210000, C: 70000 }
  };

  static async buildReferralHierarchy(userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        referrer: {
          include: {
            referrer: {
              include: {
                referrer: true
              }
            }
          }
        }
      }
    });

    if (!user?.referrer) return;

    // Clear existing hierarchy for this user
    await db.referralHierarchy.deleteMany({
      where: { userId }
    });

    // A-level: Direct referrer
    await db.referralHierarchy.create({
      data: {
        userId,
        referrerId: user.referrer.id,
        level: 'A_LEVEL'
      }
    });

    // B-level: Referrer's referrer
    if (user.referrer.referrer) {
      await db.referralHierarchy.create({
        data: {
          userId,
          referrerId: user.referrer.referrer.id,
          level: 'B_LEVEL'
        }
      });

      // C-level: Referrer's referrer's referrer
      if (user.referrer.referrer.referrer) {
        await db.referralHierarchy.create({
          data: {
            userId,
            referrerId: user.referrer.referrer.referrer.id,
            level: 'C_LEVEL'
          }
        });
      }
    }
  }

  static async processThreeTierReferralRewards(
    newUserId: string,
    newUserPositionName: string
  ): Promise<ThreeTierRewardResult> {
    try {
      const hierarchy = await db.referralHierarchy.findMany({
        where: { userId: newUserId },
        include: {
          referrer: {
            include: {
              currentPosition: true
            }
          }
        }
      });

      const result: ThreeTierRewardResult = {
        success: true,
        totalRewardsDistributed: 0,
        rewardsBreakdown: {}
      };

      for (const hierarchyEntry of hierarchy) {
        const referrer = hierarchyEntry.referrer;
        const referrerPosition = referrer.currentPosition;
        
        if (!referrerPosition || referrerPosition.name === 'Intern') continue;

        const rewardAmount = this.calculateReferralReward(
          referrerPosition.name,
          newUserPositionName,
          hierarchyEntry.level
        );

        if (rewardAmount > 0) {
          await this.awardReferralReward(
            referrer.id,
            newUserId,
            rewardAmount,
            hierarchyEntry.level,
            referrerPosition.name,
            newUserPositionName
          );

          result.totalRewardsDistributed += rewardAmount;
          
          if (hierarchyEntry.level === 'A_LEVEL') {
            result.rewardsBreakdown.aLevel = {
              userId: referrer.id,
              amount: rewardAmount,
              positionName: referrerPosition.name
            };
          } else if (hierarchyEntry.level === 'B_LEVEL') {
            result.rewardsBreakdown.bLevel = {
              userId: referrer.id,
              amount: rewardAmount,
              positionName: referrerPosition.name
            };
          } else if (hierarchyEntry.level === 'C_LEVEL') {
            result.rewardsBreakdown.cLevel = {
              userId: referrer.id,
              amount: rewardAmount,
              positionName: referrerPosition.name
            };
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing three-tier referral rewards:', error);
      return {
        success: false,
        totalRewardsDistributed: 0,
        rewardsBreakdown: {}
      };
    }
  }

  private static calculateReferralReward(
    referrerPositionName: string,
    newUserPositionName: string,
    hierarchyLevel: ReferralLevel
  ): number {
    // Skip Intern positions
    if (referrerPositionName === 'Intern' || newUserPositionName === 'Intern') {
      return 0;
    }

    const referrerLevel = this.getPositionLevel(referrerPositionName);
    const newUserLevel = this.getPositionLevel(newUserPositionName);

    if (referrerLevel === 0 || newUserLevel === 0) return 0;

    const referrerRates = this.REWARD_RATES[referrerPositionName as keyof ReferralRewardRates];
    if (!referrerRates) return 0;

    // Rule 2: If inviting someone at higher level, only get A-level reward for own level
    if (newUserLevel > referrerLevel) {
      return hierarchyLevel === 'A_LEVEL' ? referrerRates.A : 0;
    }

    // Rule 1: If inviting someone at same or lower level, get full reward based on hierarchy
    switch (hierarchyLevel) {
      case 'A_LEVEL':
        return referrerRates.A;
      case 'B_LEVEL':
        return referrerRates.B;
      case 'C_LEVEL':
        return referrerRates.C;
      default:
        return 0;
    }
  }

  private static getPositionLevel(positionName: string): number {
    const levelMap: Record<string, number> = {
      'Intern': 0, 'P1': 1, 'P2': 2, 'P3': 3, 'P4': 4, 'P5': 5,
      'P6': 6, 'P7': 7, 'P8': 8, 'P9': 9, 'P10': 10
    };
    return levelMap[positionName] || 0;
  }

  private static async awardReferralReward(
    referrerId: string,
    referredUserId: string,
    amount: number,
    level: ReferralLevel,
    referrerPositionName: string,
    newUserPositionName: string
  ): Promise<void> {
    const transactionType = level === 'A_LEVEL' ? 'REFERRAL_REWARD_A' :
                           level === 'B_LEVEL' ? 'REFERRAL_REWARD_B' : 'REFERRAL_REWARD_C';

    await db.$transaction(async (tx) => {
      // Update referrer's balance
      await tx.user.update({
        where: { id: referrerId },
        data: {
          walletBalance: { increment: amount },
          totalEarnings: { increment: amount }
        }
      });

      // Get updated balance
      const updatedReferrer = await tx.user.findUnique({
        where: { id: referrerId },
        select: { walletBalance: true }
      });

      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          userId: referrerId,
          type: transactionType,
          amount,
          balanceAfter: updatedReferrer!.walletBalance,
          description: `${level.replace('_', '-')} Referral Reward: New ${newUserPositionName} member`,
          referenceId: `REFERRAL_${level}_${referredUserId}_${Date.now()}`,
          status: 'COMPLETED',
          metadata: JSON.stringify({
            referredUserId,
            hierarchyLevel: level,
            referrerPosition: referrerPositionName,
            newUserPosition: newUserPositionName
          })
        }
      });
    });
  }

  static async getReferralHierarchyStats(userId: string): Promise<{
    aLevelCount: number;
    bLevelCount: number;
    cLevelCount: number;
    totalEarnings: {
      aLevel: number;
      bLevel: number;
      cLevel: number;
      total: number;
    };
  }> {
    try {
      const [aLevelUsers, bLevelUsers, cLevelUsers, earnings] = await Promise.all([
        db.referralHierarchy.count({
          where: { referrerId: userId, level: 'A_LEVEL' }
        }),
        db.referralHierarchy.count({
          where: { referrerId: userId, level: 'B_LEVEL' }
        }),
        db.referralHierarchy.count({
          where: { referrerId: userId, level: 'C_LEVEL' }
        }),
        db.walletTransaction.groupBy({
          by: ['type'],
          where: {
            userId,
            type: { in: ['REFERRAL_REWARD_A', 'REFERRAL_REWARD_B', 'REFERRAL_REWARD_C'] }
          },
          _sum: { amount: true }
        })
      ]);

      const earningsMap = earnings.reduce((acc, item) => {
        acc[item.type] = item._sum.amount || 0;
        return acc;
      }, {} as Record<string, number>);

      const aLevelEarnings = earningsMap['REFERRAL_REWARD_A'] || 0;
      const bLevelEarnings = earningsMap['REFERRAL_REWARD_B'] || 0;
      const cLevelEarnings = earningsMap['REFERRAL_REWARD_C'] || 0;

      return {
        aLevelCount: aLevelUsers,
        bLevelCount: bLevelUsers,
        cLevelCount: cLevelUsers,
        totalEarnings: {
          aLevel: aLevelEarnings,
          bLevel: bLevelEarnings,
          cLevel: cLevelEarnings,
          total: aLevelEarnings + bLevelEarnings + cLevelEarnings
        }
      };
    } catch (error) {
      console.error('Error getting referral hierarchy stats:', error);
      return {
        aLevelCount: 0,
        bLevelCount: 0,
        cLevelCount: 0,
        totalEarnings: { aLevel: 0, bLevel: 0, cLevel: 0, total: 0 }
      };
    }
  }
}
