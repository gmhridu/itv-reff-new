import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyUserPlans() {
  try {
    console.log('🔍 Verifying user plans data...');

    // Get total counts
    const totalPlans = await prisma.plan.count();
    const totalUserPlans = await prisma.userPlan.count();
    const totalUsers = await prisma.user.count();
    
    console.log(`📊 Database Overview:`);
    console.log(`   Total Plans: ${totalPlans}`);
    console.log(`   Total User Plans: ${totalUserPlans}`);
    console.log(`   Total Users: ${totalUsers}`);

    // Get all plans with details
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' }
    });

    console.log('\n📦 Available Plans:');
    console.log('==================');
    
    plans.forEach((plan, index) => {
      const dailyEarning = plan.dailyVideoLimit * plan.rewardPerVideo;
      const monthlyEarning = dailyEarning * 30;
      const roi = ((monthlyEarning - plan.price) / plan.price * 100).toFixed(1);
      
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   Price: ${plan.price} PKR | Duration: ${plan.durationDays} days`);
      console.log(`   Daily Videos: ${plan.dailyVideoLimit} | Reward/Video: ${plan.rewardPerVideo} PKR`);
      console.log(`   Daily Earning: ${dailyEarning} PKR | Monthly: ${monthlyEarning} PKR`);
      console.log(`   ROI: ${roi}% | Referral Bonus: ${plan.referralBonus} PKR`);
      console.log(`   Status: ${plan.isActive ? 'Active' : 'Inactive'}`);
      console.log('');
    });

    // Get user plans with details
    const userPlans = await prisma.userPlan.findMany({
      include: {
        user: {
          select: {
            email: true,
            walletBalance: true
          }
        },
        plan: {
          select: {
            name: true,
            price: true,
            dailyVideoLimit: true,
            rewardPerVideo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 15 // Show first 15 for detailed view
    });

    console.log('\n👥 User Plan Details (Latest 15):');
    console.log('=================================');
    
    userPlans.forEach((userPlan, index) => {
      const daysRemaining = userPlan.status === 'ACTIVE' 
        ? Math.max(0, Math.ceil((userPlan.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      
      console.log(`${index + 1}. ${userPlan.user.email}`);
      console.log(`   Plan: ${userPlan.plan.name} (${userPlan.plan.price} PKR)`);
      console.log(`   Status: ${userPlan.status}`);
      console.log(`   Period: ${userPlan.startDate.toISOString().split('T')[0]} to ${userPlan.endDate.toISOString().split('T')[0]}`);
      console.log(`   Days Remaining: ${daysRemaining}`);
      console.log(`   Amount Paid: ${userPlan.amountPaid} PKR`);
      console.log(`   User Wallet: ${userPlan.user.walletBalance} PKR`);
      console.log('');
    });

    // Plan distribution analysis
    const planDistribution = await prisma.userPlan.groupBy({
      by: ['planId'],
      _count: { id: true },
      _avg: { amountPaid: true }
    });

    console.log('\n📈 Plan Popularity Analysis:');
    console.log('============================');
    
    for (const dist of planDistribution) {
      const plan = await prisma.plan.findUnique({
        where: { id: dist.planId },
        select: { name: true, price: true }
      });
      
      const percentage = ((dist._count.id / totalUserPlans) * 100).toFixed(1);
      
      console.log(`${plan?.name}:`);
      console.log(`  Users: ${dist._count.id} (${percentage}%)`);
      console.log(`  Avg Paid: ${dist._avg.amountPaid?.toFixed(2)} PKR`);
      console.log('');
    }

    // Status distribution
    const statusDistribution = await prisma.userPlan.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amountPaid: true }
    });

    console.log('\n📊 Status Distribution:');
    console.log('=======================');
    
    statusDistribution.forEach(dist => {
      const percentage = ((dist._count.id / totalUserPlans) * 100).toFixed(1);
      console.log(`${dist.status}:`);
      console.log(`  Count: ${dist._count.id} (${percentage}%)`);
      console.log(`  Total Revenue: ${dist._sum.amountPaid?.toFixed(2)} PKR`);
      console.log('');
    });

    // Revenue analysis
    const totalRevenue = await prisma.userPlan.aggregate({
      _sum: { amountPaid: true }
    });

    const activeRevenue = await prisma.userPlan.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { amountPaid: true }
    });

    console.log('\n💰 Revenue Analysis:');
    console.log('====================');
    console.log(`Total Revenue: ${totalRevenue._sum.amountPaid?.toFixed(2)} PKR`);
    console.log(`Active Plans Revenue: ${activeRevenue._sum.amountPaid?.toFixed(2)} PKR`);
    
    const avgRevenuePerUser = totalRevenue._sum.amountPaid ? 
      (totalRevenue._sum.amountPaid / totalUserPlans).toFixed(2) : '0';
    console.log(`Average Revenue per User Plan: ${avgRevenuePerUser} PKR`);

    // Expiry analysis for active plans
    const activePlans = await prisma.userPlan.findMany({
      where: { status: 'ACTIVE' },
      select: { endDate: true }
    });

    const now = new Date();
    const expiringIn7Days = activePlans.filter(plan => {
      const daysUntilExpiry = Math.ceil((plan.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    }).length;

    const expiringIn30Days = activePlans.filter(plan => {
      const daysUntilExpiry = Math.ceil((plan.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    console.log('\n⏰ Expiry Analysis:');
    console.log('==================');
    console.log(`Plans expiring in 7 days: ${expiringIn7Days}`);
    console.log(`Plans expiring in 30 days: ${expiringIn30Days}`);

    console.log('\n✅ User plans verification completed!');

  } catch (error) {
    console.error('❌ Error verifying user plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification function
if (require.main === module) {
  verifyUserPlans()
    .then(() => {
      console.log('✅ User plans verification process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ User plans verification failed:', error);
      process.exit(1);
    });
}

export default verifyUserPlans;
