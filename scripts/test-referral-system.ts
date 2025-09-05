import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

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

interface TestUser {
  id: string;
  email: string;
  name: string;
  referralCode: string;
  accessToken: string;
  walletBalance: number;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

class ReferralSystemTester {
  private testUsers: TestUser[] = [];
  private testResults: TestResult[] = [];

  // Helper function to make authenticated API calls
  private async apiCall(endpoint: string, options: any = {}, token?: string): Promise<any> {
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} - ${JSON.stringify(data)}`);
    }

    return data;
  }

  // Clean up test data
  private async cleanupTestData(): Promise<void> {
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
  private async verifyPositionLevels(): Promise<TestResult> {
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
  private async registerUser(userData: any, referralCode?: string): Promise<TestUser> {
    console.log(`👤 Registering user: ${userData.email}${referralCode ? ` with referral: ${referralCode}` : ''}`);

    const registerData = {
      ...userData,
      confirmPassword: userData.password,
      referralCode
    };

    const response = await this.apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData)
    });

    if (!response.success) {
      throw new Error(`Registration failed: ${response.error}`);
    }

    const user: TestUser = {
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
  }

  // Get user's referral link
  private async getReferralLink(user: TestUser): Promise<string> {
    const response = await this.apiCall('/api/referral/code', {
      method: 'GET'
    }, user.accessToken);

    return response.referralLink;
  }

  // Check referral hierarchy
  private async checkReferralHierarchy(user: TestUser): Promise<any> {
    const response = await this.apiCall('/api/referrals/hierarchy', {
      method: 'GET'
    }, user.accessToken);

    return response;
  }

  // Get wallet balance
  private async getWalletBalance(user: TestUser): Promise<number> {
    const response = await this.apiCall('/api/wallet/balance', {
      method: 'GET'
    }, user.accessToken);

    return response.balance;
  }

  // Add test result
  private addTestResult(result: TestResult): void {
    this.testResults.push(result);
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.message}`);
    if (result.details && !result.success) {
      console.log('   Details:', JSON.stringify(result.details, null, 2));
    }
  }

  // Print test summary
  private printTestSummary(): void {
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

  // Test basic registration and hierarchy building
  async testRegistrationAndHierarchy(): Promise<void> {
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

      // Check User B's hierarchy (should have C as A-level, D as B-level)
      const hierarchyB = await this.checkReferralHierarchy(userB);
      const expectedCountsB = { aLevel: 1, bLevel: 1, cLevel: 0 };
      const actualCountsB = {
        aLevel: hierarchyB.hierarchyStats.aLevelCount,
        bLevel: hierarchyB.hierarchyStats.bLevelCount,
        cLevel: hierarchyB.hierarchyStats.cLevelCount
      };

      const hierarchyBCorrect =
        actualCountsB.aLevel === expectedCountsB.aLevel &&
        actualCountsB.bLevel === expectedCountsB.bLevel &&
        actualCountsB.cLevel === expectedCountsB.cLevel;

      this.addTestResult({
        success: hierarchyBCorrect,
        message: hierarchyBCorrect
          ? 'User B hierarchy correct (A:1, B:1, C:0)'
          : 'User B hierarchy incorrect',
        details: { expected: expectedCountsB, actual: actualCountsB }
      });

    } catch (error) {
      this.addTestResult({
        success: false,
        message: `Registration and hierarchy test failed: ${error}`,
        details: { error }
      });
    }
  }

  // Main test runner
  async runTests(): Promise<void> {
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
        message: `Test execution failed: ${error}`,
        details: { error }
      });
    } finally {
      this.printTestSummary();
    }
  }
}

// Export for use in other test files
export { ReferralSystemTester, TestUser, TestResult };

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
