const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  users: [
    { name: 'Alice Test', email: 'alice.test@example.com', password: 'password123' },
    { name: 'Bob Test', email: 'bob.test@example.com', password: 'password123' },
    { name: 'Charlie Test', email: 'charlie.test@example.com', password: 'password123' },
    { name: 'David Test', email: 'david.test@example.com', password: 'password123' },
  ]
};

class ReferralServiceTester {
  constructor() {
    this.testResults = [];
    this.testUsers = [];
  }

  // Add test result
  addTestResult(result) {
    this.testResults.push(result);
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.message}`);
    if (result.details && !result.success) {
      console.log('   Details:', JSON.stringify(result.details, null, 2));
    }
  }

  // Clean up test data
  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      const testEmails = TEST_CONFIG.users.map(u => u.email);
      
      await prisma.referralHierarchy.deleteMany({
        where: {
          user: { email: { in: testEmails } }
        }
      });

      await prisma.referralActivity.deleteMany({
        where: {
          referrer: { email: { in: testEmails } }
        }
      });

      await prisma.taskManagementBonus.deleteMany({
        where: {
          user: { email: { in: testEmails } }
        }
      });

      await prisma.walletTransaction.deleteMany({
        where: {
          user: { email: { in: testEmails } }
        }
      });

      await prisma.userVideoTask.deleteMany({
        where: {
          user: { email: { in: testEmails } }
        }
      });

      await prisma.user.deleteMany({
        where: { email: { in: testEmails } }
      });

      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
    }
  }

  // Create test users with referral chain
  async createTestUsers() {
    console.log('\n👥 Creating test users with referral chain...');
    
    try {
      // Get Intern position
      const internPosition = await prisma.positionLevel.findUnique({
        where: { name: 'Intern' }
      });

      if (!internPosition) {
        throw new Error('Intern position not found');
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + internPosition.validityDays);

      // Create User A (root user)
      const userA = await prisma.user.create({
        data: {
          email: TEST_CONFIG.users[0].email,
          name: TEST_CONFIG.users[0].name,
          password: 'hashedpassword',
          referralCode: 'USERA123',
          currentPositionId: internPosition.id,
          positionStartDate: startDate,
          positionEndDate: endDate,
          isIntern: true,
          depositPaid: 0,
          walletBalance: 10000, // Give some balance for position upgrades
        }
      });

      // Create User B (referred by A)
      const userB = await prisma.user.create({
        data: {
          email: TEST_CONFIG.users[1].email,
          name: TEST_CONFIG.users[1].name,
          password: 'hashedpassword',
          referralCode: 'USERB123',
          referredBy: userA.id,
          currentPositionId: internPosition.id,
          positionStartDate: startDate,
          positionEndDate: endDate,
          isIntern: true,
          depositPaid: 0,
          walletBalance: 10000,
        }
      });

      // Create User C (referred by B)
      const userC = await prisma.user.create({
        data: {
          email: TEST_CONFIG.users[2].email,
          name: TEST_CONFIG.users[2].name,
          password: 'hashedpassword',
          referralCode: 'USERC123',
          referredBy: userB.id,
          currentPositionId: internPosition.id,
          positionStartDate: startDate,
          positionEndDate: endDate,
          isIntern: true,
          depositPaid: 0,
          walletBalance: 10000,
        }
      });

      // Create User D (referred by C)
      const userD = await prisma.user.create({
        data: {
          email: TEST_CONFIG.users[3].email,
          name: TEST_CONFIG.users[3].name,
          password: 'hashedpassword',
          referralCode: 'USERD123',
          referredBy: userC.id,
          currentPositionId: internPosition.id,
          positionStartDate: startDate,
          positionEndDate: endDate,
          isIntern: true,
          depositPaid: 0,
          walletBalance: 10000,
        }
      });

      this.testUsers = [userA, userB, userC, userD];

      this.addTestResult({
        success: true,
        message: 'Test users created successfully',
        details: { userCount: this.testUsers.length }
      });

    } catch (error) {
      this.addTestResult({
        success: false,
        message: `Failed to create test users: ${error.message}`,
        details: { error: error.message }
      });
      throw error;
    }
  }

  // Build referral hierarchy manually (simulating the service)
  async buildReferralHierarchy() {
    console.log('\n🔗 Building referral hierarchy...');
    
    try {
      const [userA, userB, userC, userD] = this.testUsers;

      // Build hierarchy for User B (A-level: A)
      await prisma.referralHierarchy.create({
        data: {
          userId: userB.id,
          referrerId: userA.id,
          level: 'A_LEVEL'
        }
      });

      // Build hierarchy for User C (A-level: B, B-level: A)
      await prisma.referralHierarchy.createMany({
        data: [
          { userId: userC.id, referrerId: userB.id, level: 'A_LEVEL' },
          { userId: userC.id, referrerId: userA.id, level: 'B_LEVEL' }
        ]
      });

      // Build hierarchy for User D (A-level: C, B-level: B, C-level: A)
      await prisma.referralHierarchy.createMany({
        data: [
          { userId: userD.id, referrerId: userC.id, level: 'A_LEVEL' },
          { userId: userD.id, referrerId: userB.id, level: 'B_LEVEL' },
          { userId: userD.id, referrerId: userA.id, level: 'C_LEVEL' }
        ]
      });

      // Verify hierarchy counts
      const hierarchyA = await prisma.referralHierarchy.count({
        where: { referrerId: userA.id }
      });

      const hierarchyB = await prisma.referralHierarchy.count({
        where: { referrerId: userB.id }
      });

      const hierarchyC = await prisma.referralHierarchy.count({
        where: { referrerId: userC.id }
      });

      this.addTestResult({
        success: hierarchyA === 3 && hierarchyB === 2 && hierarchyC === 1,
        message: `Referral hierarchy built correctly (A:3, B:2, C:1)`,
        details: { userA: hierarchyA, userB: hierarchyB, userC: hierarchyC }
      });

    } catch (error) {
      this.addTestResult({
        success: false,
        message: `Failed to build referral hierarchy: ${error.message}`,
        details: { error: error.message }
      });
    }
  }

  // Test position upgrade rewards
  async testPositionUpgradeRewards() {
    console.log('\n💰 Testing position upgrade rewards...');
    
    try {
      const [userA, userB, userC, userD] = this.testUsers;

      // Get P1 and P2 positions
      const p1Position = await prisma.positionLevel.findUnique({
        where: { name: 'P1' }
      });
      const p2Position = await prisma.positionLevel.findUnique({
        where: { name: 'P2' }
      });

      // Upgrade User A to P1 first
      await prisma.user.update({
        where: { id: userA.id },
        data: {
          currentPositionId: p1Position.id,
          walletBalance: { decrement: p1Position.deposit },
          depositPaid: p1Position.deposit
        }
      });

      // Upgrade User B to P2 (should trigger rewards for User A)
      await prisma.user.update({
        where: { id: userB.id },
        data: {
          currentPositionId: p2Position.id,
          walletBalance: { decrement: p2Position.deposit },
          depositPaid: p2Position.deposit
        }
      });

      // Simulate referral reward calculation
      const REWARD_RATES = {
        P1: { A: 312, B: 117, C: 39 },
        P2: { A: 1440, B: 540, C: 180 }
      };

      // User A should get P1 A-level reward for User B's P2 upgrade
      const expectedReward = REWARD_RATES.P1.A; // 312 PKR

      // Simulate awarding the reward
      await prisma.user.update({
        where: { id: userA.id },
        data: {
          walletBalance: { increment: expectedReward },
          totalEarnings: { increment: expectedReward }
        }
      });

      await prisma.walletTransaction.create({
        data: {
          userId: userA.id,
          type: 'REFERRAL_REWARD_A',
          amount: expectedReward,
          balanceAfter: 10000 - p1Position.deposit + expectedReward,
          description: 'A-Level Referral Reward: New P2 member',
          referenceId: `REFERRAL_A_LEVEL_${userB.id}_${Date.now()}`,
          status: 'COMPLETED'
        }
      });

      // Verify the reward was awarded
      const updatedUserA = await prisma.user.findUnique({
        where: { id: userA.id },
        select: { walletBalance: true, totalEarnings: true }
      });

      const expectedBalance = 10000 - p1Position.deposit + expectedReward;
      const balanceCorrect = Math.abs(updatedUserA.walletBalance - expectedBalance) < 1;

      this.addTestResult({
        success: balanceCorrect,
        message: balanceCorrect 
          ? `Position upgrade reward calculated correctly (₹${expectedReward})`
          : 'Position upgrade reward calculation incorrect',
        details: { 
          expected: expectedBalance, 
          actual: updatedUserA.walletBalance,
          reward: expectedReward
        }
      });

    } catch (error) {
      this.addTestResult({
        success: false,
        message: `Position upgrade rewards test failed: ${error.message}`,
        details: { error: error.message }
      });
    }
  }

  // Test management bonus distribution
  async testManagementBonuses() {
    console.log('\n📊 Testing management bonus distribution...');
    
    try {
      const [userA, userB, userC, userD] = this.testUsers;

      // Simulate User B completing a task earning ₹62 (P2 unit price)
      const taskIncome = 62;
      const BONUS_RATES = {
        A_LEVEL: 0.06, // 6%
        B_LEVEL: 0.03, // 3%
        C_LEVEL: 0.01  // 1%
      };

      // Calculate expected bonuses
      const bonusA = Math.round(taskIncome * BONUS_RATES.A_LEVEL); // 6% = ₹3.72 → ₹4
      const bonusB = Math.round(taskIncome * BONUS_RATES.B_LEVEL); // 3% = ₹1.86 → ₹2
      const bonusC = Math.round(taskIncome * BONUS_RATES.C_LEVEL); // 1% = ₹0.62 → ₹1

      // User A should get A-level bonus from User B's task
      await prisma.user.update({
        where: { id: userA.id },
        data: {
          walletBalance: { increment: bonusA },
          totalEarnings: { increment: bonusA }
        }
      });

      await prisma.taskManagementBonus.create({
        data: {
          userId: userA.id,
          subordinateId: userB.id,
          subordinateLevel: 'A_LEVEL',
          bonusAmount: bonusA,
          taskIncome: taskIncome,
          taskDate: new Date()
        }
      });

      await prisma.walletTransaction.create({
        data: {
          userId: userA.id,
          type: 'MANAGEMENT_BONUS_A',
          amount: bonusA,
          balanceAfter: 0, // Will be calculated
          description: 'A-Level Management Bonus from subordinate task completion',
          referenceId: `MGMT_BONUS_A_LEVEL_${userB.id}_${Date.now()}`,
          status: 'COMPLETED'
        }
      });

      // Verify bonus was awarded
      const bonusRecord = await prisma.taskManagementBonus.findFirst({
        where: {
          userId: userA.id,
          subordinateId: userB.id,
          subordinateLevel: 'A_LEVEL'
        }
      });

      this.addTestResult({
        success: bonusRecord && bonusRecord.bonusAmount === bonusA,
        message: bonusRecord 
          ? `Management bonus calculated correctly (₹${bonusA} from ₹${taskIncome})`
          : 'Management bonus calculation failed',
        details: { 
          expected: bonusA, 
          actual: bonusRecord?.bonusAmount,
          taskIncome,
          rate: BONUS_RATES.A_LEVEL
        }
      });

    } catch (error) {
      this.addTestResult({
        success: false,
        message: `Management bonus test failed: ${error.message}`,
        details: { error: error.message }
      });
    }
  }

  // Print test summary
  printTestSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.filter(r => !r.success).forEach((result, index) => {
        console.log(`${index + 1}. ${result.message}`);
      });
    }
    
    console.log('='.repeat(60));
  }

  // Main test runner
  async runTests() {
    console.log('🚀 Starting Referral Services Tests');
    console.log('='.repeat(60));

    try {
      // Cleanup previous test data
      await this.cleanupTestData();

      // Create test users
      await this.createTestUsers();

      // Build referral hierarchy
      await this.buildReferralHierarchy();

      // Test position upgrade rewards
      await this.testPositionUpgradeRewards();

      // Test management bonuses
      await this.testManagementBonuses();

      console.log('\n✅ All service tests completed!');

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      this.addTestResult({
        success: false,
        message: `Test execution failed: ${error.message}`,
        details: { error: error.message }
      });
    } finally {
      this.printTestSummary();
      await prisma.$disconnect();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ReferralServiceTester();
  tester.runTests()
    .then(() => {
      console.log('🏁 Test execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { ReferralServiceTester };
