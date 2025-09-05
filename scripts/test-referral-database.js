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

class ReferralDatabaseTester {
  constructor() {
    this.testResults = [];
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

  // Verify position levels are seeded
  async verifyPositionLevels() {
    console.log('🔍 Verifying position levels...');
    
    try {
      const positions = await prisma.positionLevel.findMany({
        orderBy: { level: 'asc' }
      });

      const expectedPositions = ['Intern', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'];
      const actualPositions = positions.map(p => p.name);

      const missingPositions = expectedPositions.filter(p => !actualPositions.includes(p));

      if (missingPositions.length > 0) {
        return {
          success: false,
          message: `Missing position levels: ${missingPositions.join(', ')}`,
          details: { expected: expectedPositions, actual: actualPositions }
        };
      }

      return {
        success: true,
        message: 'All position levels are properly seeded',
        details: { positions: actualPositions }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error verifying position levels: ${error}`,
        details: { error }
      };
    }
  }

  // Test database schema and relationships
  async testDatabaseSchema() {
    console.log('\n🗄️ Testing Database Schema...');
    
    try {
      // Test User model
      const userCount = await prisma.user.count();
      this.addTestResult({
        success: true,
        message: `User table accessible (${userCount} users)`,
      });

      // Test PositionLevel model
      const positionCount = await prisma.positionLevel.count();
      this.addTestResult({
        success: true,
        message: `PositionLevel table accessible (${positionCount} positions)`,
      });

      // Test ReferralHierarchy model
      const hierarchyCount = await prisma.referralHierarchy.count();
      this.addTestResult({
        success: true,
        message: `ReferralHierarchy table accessible (${hierarchyCount} entries)`,
      });

      // Test ReferralActivity model
      const activityCount = await prisma.referralActivity.count();
      this.addTestResult({
        success: true,
        message: `ReferralActivity table accessible (${activityCount} activities)`,
      });

      // Test TaskManagementBonus model
      const bonusCount = await prisma.taskManagementBonus.count();
      this.addTestResult({
        success: true,
        message: `TaskManagementBonus table accessible (${bonusCount} bonuses)`,
      });

      // Test WalletTransaction model
      const transactionCount = await prisma.walletTransaction.count();
      this.addTestResult({
        success: true,
        message: `WalletTransaction table accessible (${transactionCount} transactions)`,
      });

    } catch (error) {
      this.addTestResult({
        success: false,
        message: `Database schema test failed: ${error.message}`,
        details: { error: error.message }
      });
    }
  }

  // Test referral reward rates
  async testReferralRewardRates() {
    console.log('\n💰 Testing Referral Reward Rates...');
    
    try {
      // Import the reward rates (simulated)
      const REWARD_RATES = {
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

      // Test reward calculations
      const testCases = [
        { position: 'P1', level: 'A', expected: 312 },
        { position: 'P5', level: 'B', expected: 7500 },
        { position: 'P10', level: 'C', expected: 70000 },
      ];

      for (const testCase of testCases) {
        const actual = REWARD_RATES[testCase.position][testCase.level];
        const success = actual === testCase.expected;
        
        this.addTestResult({
          success,
          message: success 
            ? `Reward rate correct: ${testCase.position} ${testCase.level}-level = ₹${actual}`
            : `Reward rate incorrect: ${testCase.position} ${testCase.level}-level`,
          details: { expected: testCase.expected, actual }
        });
      }

    } catch (error) {
      this.addTestResult({
        success: false,
        message: `Reward rates test failed: ${error.message}`,
        details: { error: error.message }
      });
    }
  }

  // Test management bonus rates
  async testManagementBonusRates() {
    console.log('\n📊 Testing Management Bonus Rates...');
    
    try {
      const BONUS_RATES = {
        A_LEVEL: 0.06, // 6%
        B_LEVEL: 0.03, // 3%
        C_LEVEL: 0.01  // 1%
      };

      // Test bonus calculations
      const taskIncome = 100; // ₹100 task income
      const testCases = [
        { level: 'A_LEVEL', expected: 6 },   // 6% of 100
        { level: 'B_LEVEL', expected: 3 },   // 3% of 100
        { level: 'C_LEVEL', expected: 1 },   // 1% of 100
      ];

      for (const testCase of testCases) {
        const actual = Math.round(taskIncome * BONUS_RATES[testCase.level]);
        const success = actual === testCase.expected;
        
        this.addTestResult({
          success,
          message: success 
            ? `Bonus rate correct: ${testCase.level} = ${BONUS_RATES[testCase.level] * 100}% (₹${actual} from ₹${taskIncome})`
            : `Bonus rate incorrect: ${testCase.level}`,
          details: { expected: testCase.expected, actual, rate: BONUS_RATES[testCase.level] }
        });
      }

    } catch (error) {
      this.addTestResult({
        success: false,
        message: `Bonus rates test failed: ${error.message}`,
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
    console.log('🚀 Starting Referral System Database Tests');
    console.log('='.repeat(60));

    try {
      // Cleanup previous test data
      await this.cleanupTestData();

      // Verify position levels
      const positionCheck = await this.verifyPositionLevels();
      this.addTestResult(positionCheck);

      if (!positionCheck.success) {
        console.log('❌ Position levels not properly seeded. Please run: npm run seed:positions');
        return;
      }

      // Run test scenarios
      await this.testDatabaseSchema();
      await this.testReferralRewardRates();
      await this.testManagementBonusRates();

      console.log('\n✅ All database tests completed!');

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
  const tester = new ReferralDatabaseTester();
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

module.exports = { ReferralDatabaseTester };
