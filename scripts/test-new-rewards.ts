import { PrismaClient } from '@prisma/client';
import { EnhancedReferralService } from '../src/lib/enhanced-referral-service';

const prisma = new PrismaClient();

async function testNewRewards() {
  console.log('Testing new reward calculation with 10%-3%-1% structure...\n');

  try {
    // Test reward calculation for different position levels
    const testCases = [
      { referrerPosition: 'L1', newUserPosition: 'L1' },
      { referrerPosition: 'L1', newUserPosition: 'L2' }, // Higher level
      { referrerPosition: 'L5', newUserPosition: 'L5' },
      { referrerPosition: 'L5', newUserPosition: 'L3' }, // Lower level
      { referrerPosition: 'L10', newUserPosition: 'L10' },
    ];

    console.log('Testing reward calculations:');
    console.log('Referrer Position | New User Position | A-Level Reward | B-Level Reward | C-Level Reward');
    console.log('------------------|-------------------|----------------|----------------|----------------');

    for (const testCase of testCases) {
      // Test A-Level reward
      const aLevelReward = EnhancedReferralService['calculateReferralReward'](
        testCase.referrerPosition,
        testCase.newUserPosition,
        'A_LEVEL'
      );

      // Test B-Level reward
      const bLevelReward = EnhancedReferralService['calculateReferralReward'](
        testCase.referrerPosition,
        testCase.newUserPosition,
        'B_LEVEL'
      );

      // Test C-Level reward
      const cLevelReward = EnhancedReferralService['calculateReferralReward'](
        testCase.referrerPosition,
        testCase.newUserPosition,
        'C_LEVEL'
      );

      console.log(
        `${testCase.referrerPosition.padEnd(17)} | ${testCase.newUserPosition.padEnd(17)} | ${aLevelReward.toString().padEnd(14)} | ${bLevelReward.toString().padEnd(14)} | ${cLevelReward.toString().padEnd(14)}`
      );
    }

    console.log('\n✅ Reward calculation tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNewRewards();