import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedReferralRewards() {
  try {
    console.log('🎁 Seeding referral rewards...');

    // Check if rewards already exist
    const existingRewards = await prisma.referralReward.count();
    if (existingRewards > 0) {
      console.log(`⚠️  Found ${existingRewards} existing referral rewards. Skipping seeding.`);
      return;
    }

    const rewardsToCreate = [
      {
        name: 'Registration Bonus',
        description: 'Reward for successful referral registration',
        triggerEvent: 'registration',
        rewardAmount: 2.00,
        isActive: true,
        maxRewards: null, // Unlimited
      },
      {
        name: 'First Video Bonus',
        description: 'Reward when referred user watches their first video',
        triggerEvent: 'first_video',
        rewardAmount: 3.00,
        isActive: true,
        maxRewards: null,
      },
      {
        name: 'First Plan Purchase',
        description: 'Reward when referred user purchases their first subscription plan',
        triggerEvent: 'first_plan',
        rewardAmount: 10.00,
        isActive: true,
        maxRewards: null,
      },
      {
        name: 'Weekly Activity Bonus',
        description: 'Reward when referred user completes 7 days of activity',
        triggerEvent: 'weekly_activity',
        rewardAmount: 5.00,
        isActive: true,
        maxRewards: null,
      },
      {
        name: 'Monthly Milestone',
        description: 'Reward when referred user reaches 30 days of activity',
        triggerEvent: 'monthly_milestone',
        rewardAmount: 15.00,
        isActive: true,
        maxRewards: null,
      },
      {
        name: 'High Earner Bonus',
        description: 'Reward when referred user earns their first $50',
        triggerEvent: 'high_earner',
        rewardAmount: 20.00,
        isActive: true,
        maxRewards: null,
      }
    ];

    console.log('📝 Creating referral rewards...');
    const result = await prisma.referralReward.createMany({
      data: rewardsToCreate,
      skipDuplicates: true
    });

    console.log(`✅ Successfully created ${result.count} referral rewards!`);
    
    // Show created rewards
    const rewards = await prisma.referralReward.findMany({
      orderBy: { rewardAmount: 'asc' }
    });

    console.log('\n🎁 Created Referral Rewards:');
    rewards.forEach((reward, index) => {
      console.log(`\n${index + 1}. ${reward.name}`);
      console.log(`   💰 Reward: $${reward.rewardAmount}`);
      console.log(`   🎯 Trigger: ${reward.triggerEvent}`);
      console.log(`   📝 ${reward.description}`);
      console.log(`   📊 Status: ${reward.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   🔢 Max rewards: ${reward.maxRewards || 'Unlimited'}`);
    });

    console.log('\n📊 Reward Statistics:');
    console.log(`📋 Total rewards: ${rewards.length}`);
    console.log(`💰 Total potential per referral: $${rewards.reduce((sum, r) => sum + r.rewardAmount, 0)}`);
    console.log(`🎯 Trigger events: ${[...new Set(rewards.map(r => r.triggerEvent))].join(', ')}`);

  } catch (error) {
    console.error('❌ Error seeding referral rewards:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedReferralRewards();
