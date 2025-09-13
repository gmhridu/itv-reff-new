#!/usr/bin/env bun

/**
 * User Plans Setup Script
 *
 * This script sets up the complete user plans system:
 * 1. Applies database schema changes
 * 2. Cleans existing plan data
 * 3. Seeds subscription plans
 * 4. Creates user plan assignments
 * 5. Verifies the setup
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import seedUserPlans from './seed-user-plans';
import verifyUserPlans from './verify-user-plans';

const prisma = new PrismaClient();

async function setupUserPlans() {
  console.log('🚀 Starting User Plans Setup Process...');
  console.log('=======================================\n');

  try {
    // Step 1: Apply database schema changes
    console.log('📊 Step 1: Applying database schema changes...');
    try {
      execSync('bun run db:push', { stdio: 'inherit' });
      console.log('✅ Database schema updated successfully\n');
    } catch (error) {
      console.error('❌ Failed to update database schema:', error);
      throw error;
    }

    // Step 2: Check if users exist
    console.log('👥 Step 2: Checking for existing users...');
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      console.log('⚠️  No users found. User plans require existing users.');
      console.log('💡 Please create some users first. You can:');
      console.log('   - Register users through the application');
      console.log('   - Run a user seeding script if available');
      console.log('   - Create test users manually\n');

      // Create a few test users for demonstration
      console.log('🔧 Creating test users for demonstration...');
      const testUsers = [
        {
          email: 'user1@example.com',
          name: 'Test User 1',
          phone: '+923001234567', // 添加必需的 phone 字段
          password: '$2b$10$example.hash.here', // In real app, this would be properly hashed
          referralCode: 'TEST001',
          walletBalance: 5000,
        },
        {
          email: 'user2@example.com',
          name: 'Test User 2',
          phone: '+923001234568', // 添加必需的 phone 字段
          password: '$2b$10$example.hash.here',
          referralCode: 'TEST002',
          walletBalance: 3000,
        },
        {
          email: 'user3@example.com',
          name: 'Test User 3',
          phone: '+923001234569', // 添加必需的 phone 字段
          password: '$2b$10$example.hash.here',
          referralCode: 'TEST003',
          walletBalance: 8000,
        }
      ];

      for (const userData of testUsers) {
        try {
          await prisma.user.create({ data: userData });
          console.log(`✓ Created test user: ${userData.email}`);
        } catch (error) {
          console.log(`⚠️  Test user ${userData.email} already exists, skipping...`);
        }
      }
      console.log('');
    } else {
      console.log(`✅ Found ${userCount} existing users\n`);
    }

    // Step 3: Seed user plans
    console.log('📋 Step 3: Seeding user plans and subscriptions...');
    await seedUserPlans();
    console.log('✅ User plans seeded successfully\n');

    // Step 4: Verify setup
    console.log('🔍 Step 4: Verifying user plans setup...');
    await verifyUserPlans();
    console.log('✅ User plans setup verified successfully\n');

    // Step 5: Summary and next steps
    console.log('📋 Setup Summary:');
    console.log('=================');

    const totalPlans = await prisma.plan.count();
    const totalUserPlans = await prisma.userPlan.count();
    const totalUsers = await prisma.user.count();
    const activePlans = await prisma.userPlan.count({ where: { status: 'ACTIVE' } });

    console.log(`📦 Total Subscription Plans: ${totalPlans}`);
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log(`📋 Total User Plan Assignments: ${totalUserPlans}`);
    console.log(`✅ Active User Plans: ${activePlans}`);

    // Revenue summary
    const totalRevenue = await prisma.userPlan.aggregate({
      _sum: { amountPaid: true }
    });

    console.log(`💰 Total Revenue: ${totalRevenue._sum.amountPaid?.toFixed(2) || '0'} PKR`);

    console.log('\n🎉 User plans setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('- Users can now view available subscription plans');
    console.log('- Users can subscribe to plans through the API');
    console.log('- The /api/user/plan endpoint will return user plan information');
    console.log('- Plan-based features are now available in the application');
    console.log('- You can test the plans API endpoints');

    console.log('\n🔗 Available API Endpoints:');
    console.log('- GET /api/plans - List all available plans');
    console.log('- POST /api/plans/subscribe - Subscribe to a plan');
    console.log('- GET /api/user/plan - Get current user plan');

  } catch (error) {
    console.error('\n❌ User plans setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupUserPlans()
    .then(() => {
      console.log('\n✅ User plans setup process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ User plans setup process failed:', error);
      process.exit(1);
    });
}

export default setupUserPlans;
