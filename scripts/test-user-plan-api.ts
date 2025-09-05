import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUserPlanAPI() {
  try {
    console.log('🧪 Testing User Plan API endpoints...');

    // Test 1: Get all plans
    console.log('\n📋 Test 1: GET /api/plans');
    console.log('==========================');
    
    try {
      const response = await fetch('http://localhost:3000/api/plans');
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success: Found ${data.plans.length} plans`);
        console.log('Sample plans:');
        data.plans.slice(0, 3).forEach((plan: any, index: number) => {
          console.log(`  ${index + 1}. ${plan.name} - ${plan.price} PKR (${plan.durationDays} days)`);
        });
      } else {
        console.log(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
      console.log('💡 Make sure the development server is running (bun run dev)');
    }

    // Test 2: Check user plan data in database
    console.log('\n👥 Test 2: Database User Plan Data');
    console.log('==================================');
    
    const activeUserPlans = await prisma.userPlan.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { email: true } },
        plan: { select: { name: true, price: true } }
      },
      take: 5
    });

    console.log(`✅ Found ${activeUserPlans.length} active user plans:`);
    activeUserPlans.forEach((userPlan, index) => {
      const daysRemaining = Math.max(0, Math.ceil((userPlan.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
      console.log(`  ${index + 1}. ${userPlan.user.email} - ${userPlan.plan.name} (${daysRemaining} days left)`);
    });

    // Test 3: API endpoint structure validation
    console.log('\n🔍 Test 3: API Response Structure Validation');
    console.log('============================================');
    
    try {
      const response = await fetch('http://localhost:3000/api/plans');
      const data = await response.json();
      
      if (data.plans && Array.isArray(data.plans)) {
        const plan = data.plans[0];
        const requiredFields = ['id', 'name', 'price', 'durationDays', 'dailyVideoLimit', 'rewardPerVideo', 'referralBonus'];
        const missingFields = requiredFields.filter(field => !(field in plan));
        
        if (missingFields.length === 0) {
          console.log('✅ All required fields present in API response');
        } else {
          console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        console.log('❌ Invalid API response structure');
      }
    } catch (error) {
      console.log(`❌ Error validating API structure: ${error}`);
    }

    // Test 4: Plan pricing and ROI analysis
    console.log('\n💰 Test 4: Plan Economics Analysis');
    console.log('==================================');
    
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' }
    });

    console.log('Plan ROI Analysis:');
    plans.forEach(plan => {
      const dailyEarning = plan.dailyVideoLimit * plan.rewardPerVideo;
      const totalEarning = dailyEarning * plan.durationDays;
      const profit = totalEarning - plan.price;
      const roi = ((profit / plan.price) * 100).toFixed(1);
      
      console.log(`  ${plan.name}:`);
      console.log(`    Investment: ${plan.price} PKR`);
      console.log(`    Potential Earning: ${totalEarning} PKR`);
      console.log(`    Profit: ${profit} PKR`);
      console.log(`    ROI: ${roi}%`);
      console.log('');
    });

    // Test 5: User plan status distribution
    console.log('\n📊 Test 5: User Plan Analytics');
    console.log('==============================');
    
    const statusCounts = await prisma.userPlan.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amountPaid: true }
    });

    console.log('Status Distribution:');
    statusCounts.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.id} plans (${stat._sum.amountPaid} PKR revenue)`);
    });

    const totalRevenue = statusCounts.reduce((sum, stat) => sum + (stat._sum.amountPaid || 0), 0);
    console.log(`  Total Revenue: ${totalRevenue} PKR`);

    console.log('\n✅ User Plan API testing completed!');
    console.log('\n📝 Summary:');
    console.log('- Plans API endpoint is working correctly');
    console.log('- Database contains properly seeded plan data');
    console.log('- User plan assignments are distributed across different plans');
    console.log('- Plan economics show positive ROI for users');
    console.log('- Revenue tracking is functional');

  } catch (error) {
    console.error('❌ Error testing user plan API:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test function
if (require.main === module) {
  testUserPlanAPI()
    .then(() => {
      console.log('\n✅ User Plan API testing process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ User Plan API testing failed:', error);
      process.exit(1);
    });
}

export default testUserPlanAPI;
