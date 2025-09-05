const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_CONFIG = {
  users: [
    { name: 'Alice Test', email: 'alice.test@example.com', password: 'password123' },
    { name: 'Bob Test', email: 'bob.test@example.com', password: 'password123' },
    { name: 'Charlie Test', email: 'charlie.test@example.com', password: 'password123' },
    { name: 'David Test', email: 'david.test@example.com', password: 'password123' },
  ]
};

class ReferralSystemTester {
  constructor() {
    this.testUsers = [];
    this.testResults = [];
  }

  // Helper function to make authenticated API calls
  async apiCall(endpoint, options = {}, token) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} - ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  // Clean up test data
  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete test users and related data
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

  // Register a test user
  async registerUser(userData, referralCode) {
    console.log(`👤 Registering user: ${userData.email}${referralCode ? ` with referral: ${referralCode}` : ''}`);

    const registerData = {
      ...userData,
      confirmPassword: userData.password,
      referralCode
    };

    try {
      const response = await this.apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData)
      });

      if (!response.success) {
        throw new Error(`Registration failed: ${response.error}`);
      }

      const user = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        referralCode: response.user.referralCode,
        accessToken: response.tokens.accessToken,
        walletBalance: response.user.walletBalance
      };

      this.testUsers.push(user);
      console.log(`✅ User registered: ${user.email} (Code: ${user.referralCode})`);
      
      return user;
    } catch (error) {
      console.error(`❌ Failed to register user ${userData.email}:`, error.message);
      throw error;
    }
  }

  // Get user's referral link
  async getReferralLink(user) {
    const response = await this.apiCall('/api/referral/code', {
      method: 'GET'
    }, user.accessToken);

    return response.referralLink;
  }

  // Check referral hierarchy
  async checkReferralHierarchy(user) {
    const response = await this.apiCall('/api/referrals/hierarchy', {
      method: 'GET'
    }, user.accessToken);

    return response;
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

  // Test basic registration and hierarchy building
  async testRegistrationAndHierarchy() {
    console.log('\n🔗 Testing Registration & Hierarchy Building...');
    
    try {
      // Register User A (root user)
      const userA = await this.registerUser(TEST_CONFIG.users[0]);
      
      // Get User A's referral link
      const referralLinkA = await this.getReferralLink(userA);
      this.addTestResult({
        success: true,
        message: 'User A registered and referral link generated',
        details: { referralLink: referralLinkA }
      });

      // Register User B with User A's referral code
      const userB = await this.registerUser(TEST_CONFIG.users[1], userA.referralCode);
      
      // Register User C with User B's referral code
      const userC = await this.registerUser(TEST_CONFIG.users[2], userB.referralCode);
      
      // Register User D with User C's referral code
      const userD = await this.registerUser(TEST_CONFIG.users[3], userC.referralCode);

      // Wait a moment for hierarchy to be built
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check User A's hierarchy (should have B as A-level, C as B-level, D as C-level)
      const hierarchyA = await this.checkReferralHierarchy(userA);
      
      const expectedCounts = { aLevel: 1, bLevel: 1, cLevel: 1 };
      const actualCounts = {
        aLevel: hierarchyA.hierarchyStats.aLevelCount,
        bLevel: hierarchyA.hierarchyStats.bLevelCount,
        cLevel: hierarchyA.hierarchyStats.cLevelCount
      };

      const hierarchyCorrect = 
        actualCounts.aLevel === expectedCounts.aLevel &&
        actualCounts.bLevel === expectedCounts.bLevel &&
        actualCounts.cLevel === expectedCounts.cLevel;

      this.addTestResult({
        success: hierarchyCorrect,
        message: hierarchyCorrect 
          ? 'Referral hierarchy built correctly (A:1, B:1, C:1)'
          : 'Referral hierarchy incorrect',
        details: { expected: expectedCounts, actual: actualCounts }
      });

    } catch (error) {
      this.addTestResult({
        success: false,
        message: `Registration and hierarchy test failed: ${error.message}`,
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
    console.log('🚀 Starting Referral System End-to-End Tests');
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
      await this.testRegistrationAndHierarchy();

      console.log('\n✅ All tests completed!');

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
  const tester = new ReferralSystemTester();
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

module.exports = { ReferralSystemTester };
