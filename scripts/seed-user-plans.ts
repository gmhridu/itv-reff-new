import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Plan data to seed
const planData = [
  {
    name: 'Basic Starter',
    description: 'Perfect for beginners who want to start earning with video tasks',
    price: 500,
    durationDays: 30,
    dailyVideoLimit: 5,
    rewardPerVideo: 10,
    referralBonus: 50,
    isActive: true,
  },
  {
    name: 'Standard Growth',
    description: 'Ideal for regular users looking to maximize their daily earnings',
    price: 1200,
    durationDays: 30,
    dailyVideoLimit: 10,
    rewardPerVideo: 15,
    referralBonus: 120,
    isActive: true,
  },
  {
    name: 'Premium Plus',
    description: 'Advanced plan with higher limits and better rewards per video',
    price: 2500,
    durationDays: 30,
    dailyVideoLimit: 20,
    rewardPerVideo: 25,
    referralBonus: 250,
    isActive: true,
  },
  {
    name: 'Professional Elite',
    description: 'For serious earners who want maximum daily video limits',
    price: 5000,
    durationDays: 30,
    dailyVideoLimit: 35,
    rewardPerVideo: 35,
    referralBonus: 500,
    isActive: true,
  },
  {
    name: 'Enterprise Master',
    description: 'Ultimate plan with the highest earning potential and exclusive benefits',
    price: 10000,
    durationDays: 30,
    dailyVideoLimit: 50,
    rewardPerVideo: 50,
    referralBonus: 1000,
    isActive: true,
  },
  {
    name: 'Weekly Trial',
    description: 'Short-term trial plan to test the platform features',
    price: 200,
    durationDays: 7,
    dailyVideoLimit: 3,
    rewardPerVideo: 8,
    referralBonus: 20,
    isActive: true,
  },
  {
    name: 'Monthly Standard',
    description: 'Standard monthly subscription with balanced features',
    price: 1500,
    durationDays: 30,
    dailyVideoLimit: 15,
    rewardPerVideo: 20,
    referralBonus: 150,
    isActive: true,
  },
  {
    name: 'Quarterly Pro',
    description: 'Three-month plan with better value and extended benefits',
    price: 4000,
    durationDays: 90,
    dailyVideoLimit: 25,
    rewardPerVideo: 30,
    referralBonus: 400,
    isActive: true,
  },
];

// User plan statuses for realistic distribution
const planStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED'] as const;
const statusWeights = [0.6, 0.3, 0.1]; // 60% active, 30% expired, 10% cancelled

function getRandomPlanStatus(): typeof planStatuses[number] {
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < statusWeights.length; i++) {
    cumulativeWeight += statusWeights[i];
    if (random <= cumulativeWeight) {
      return planStatuses[i];
    }
  }
  
  return 'ACTIVE';
}

function getRandomDateInRange(startDays: number, endDays: number): Date {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * (endDays - startDays + 1)) + startDays;
  const date = new Date(now);
  date.setDate(date.getDate() + randomDays);
  return date;
}

async function seedUserPlans() {
  try {
    console.log('📋 Starting user plans seeding process...');

    // Step 1: Clean existing data
    console.log('🧹 Cleaning existing plan data...');
    
    // Delete existing user plans first (due to foreign key constraints)
    await prisma.userPlan.deleteMany({});
    console.log('✓ Deleted all existing user plans');
    
    // Delete existing plans
    await prisma.plan.deleteMany({});
    console.log('✓ Deleted all existing plans');

    // Step 2: Create plans
    console.log('📦 Creating subscription plans...');
    
    const createdPlans = [];
    for (const planInfo of planData) {
      const plan = await prisma.plan.create({
        data: planInfo
      });
      createdPlans.push(plan);
      console.log(`✓ Created plan: ${plan.name} (${plan.price} PKR)`);
    }

    console.log(`✅ Successfully created ${createdPlans.length} plans`);

    // Step 3: Get existing users for user plan assignments
    console.log('👥 Fetching existing users...');
    
    const users = await prisma.user.findMany({
      select: { id: true, email: true, walletBalance: true },
      take: 50 // Limit to first 50 users for seeding
    });

    if (users.length === 0) {
      console.log('⚠️  No users found. User plans seeding requires existing users.');
      console.log('💡 Please create some users first or run user seeding script.');
      return;
    }

    console.log(`📊 Found ${users.length} users for plan assignments`);

    // Step 4: Create user plan assignments
    console.log('🎯 Creating user plan assignments...');
    
    const userPlansToCreate = [];
    const usersToAssignPlans = users.slice(0, Math.min(users.length, 30)); // Assign plans to up to 30 users
    
    for (const user of usersToAssignPlans) {
      // Randomly decide if user should have a plan (80% chance)
      if (Math.random() < 0.8) {
        const randomPlan = createdPlans[Math.floor(Math.random() * createdPlans.length)];
        const status = getRandomPlanStatus();
        
        let startDate: Date;
        let endDate: Date;
        
        if (status === 'ACTIVE') {
          // Active plans: started recently, end in future
          startDate = getRandomDateInRange(-30, -1); // Started 1-30 days ago
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + randomPlan.durationDays);
        } else if (status === 'EXPIRED') {
          // Expired plans: ended in the past
          endDate = getRandomDateInRange(-60, -1); // Ended 1-60 days ago
          startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - randomPlan.durationDays);
        } else {
          // Cancelled plans: started and ended in the past
          startDate = getRandomDateInRange(-90, -30); // Started 30-90 days ago
          endDate = getRandomDateInRange(-29, -1); // Ended 1-29 days ago
        }
        
        userPlansToCreate.push({
          userId: user.id,
          planId: randomPlan.id,
          amountPaid: randomPlan.price,
          startDate,
          endDate,
          status,
        });
      }
    }

    // Create user plans in batches to avoid unique constraint issues
    console.log(`📝 Creating ${userPlansToCreate.length} user plan assignments...`);
    
    let createdCount = 0;
    for (const userPlanData of userPlansToCreate) {
      try {
        await prisma.userPlan.create({
          data: userPlanData
        });
        createdCount++;
      } catch (error) {
        // Skip if user already has a plan (unique constraint)
        console.log(`⚠️  Skipped plan assignment for user (already has plan)`);
      }
    }

    console.log(`✅ Successfully created ${createdCount} user plan assignments`);

    // Step 5: Display summary
    console.log('\n📊 Seeding Summary:');
    console.log('===================');
    
    const totalPlans = await prisma.plan.count();
    const totalUserPlans = await prisma.userPlan.count();
    
    console.log(`📦 Total Plans: ${totalPlans}`);
    console.log(`👥 Total User Plans: ${totalUserPlans}`);
    
    // Plan distribution
    const planDistribution = await prisma.userPlan.groupBy({
      by: ['planId'],
      _count: { id: true }
    });
    
    console.log('\n📈 Plan Distribution:');
    for (const dist of planDistribution) {
      const plan = await prisma.plan.findUnique({
        where: { id: dist.planId },
        select: { name: true, price: true }
      });
      console.log(`  ${plan?.name}: ${dist._count.id} users (${plan?.price} PKR)`);
    }
    
    // Status distribution
    const statusDistribution = await prisma.userPlan.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('\n📊 Status Distribution:');
    for (const dist of statusDistribution) {
      console.log(`  ${dist.status}: ${dist._count.id} user plans`);
    }

    console.log('\n🎉 User plans seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding user plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedUserPlans()
    .then(() => {
      console.log('✅ User plans seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ User plans seeding failed:', error);
      process.exit(1);
    });
}

export default seedUserPlans;
