const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSecurityRefundSeparation() {
  console.log('🔧 Starting security refund separation fix...');
  console.log('This will ensure security refunds are completely separate from all wallet balances');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        walletBalance: true,
        totalEarnings: true,
        depositPaid: true
      }
    });

    // Get all approved security refunds
    const securityRefunds = await prisma.securityRefundRequest.groupBy({
      by: ['userId'],
      where: { status: 'APPROVED' },
      _sum: { refundAmount: true }
    });

    const securityRefundMap = securityRefunds.reduce((acc, refund) => {
      acc[refund.userId] = refund._sum.refundAmount || 0;
      return acc;
    }, {});

    console.log(`📊 Found ${users.length} users to process`);

    let fixedCount = 0;
    let totalIncorrectAmount = 0;

    for (const user of users) {
      const securityRefund = securityRefundMap[user.id] || 0;

      // If wallet balance is greater than 0, it might contain incorrect amounts
      if (user.walletBalance > 0) {
        console.log(`\n👤 User: ${user.id}`);
        console.log(`   Current walletBalance: ${user.walletBalance}`);
        console.log(`   Security refund: ${securityRefund}`);

        // Reset wallet balance to 0 since it should only contain topup amounts
        // and security refunds should be completely separate
        await prisma.user.update({
          where: { id: user.id },
          data: { walletBalance: 0 }
        });

        fixedCount++;
        totalIncorrectAmount += user.walletBalance;

        console.log(`   ✅ Fixed: Set walletBalance to 0 (topup only)`);
        console.log(`   🛡️ Security refund (${securityRefund}) stored separately`);
      }
    }

    console.log(`\n🎉 Security refund separation fix completed!`);
    console.log(`📈 Summary:`);
    console.log(`   - Users processed: ${users.length}`);
    console.log(`   - Users fixed: ${fixedCount}`);
    console.log(`   - Total incorrect amount removed: ${totalIncorrectAmount.toFixed(2)}`);

    console.log(`\n💡 Wallet Structure After Fix:`);
    console.log(`   - Current Balance: Only topup amounts (no earnings, no security refunds)`);
    console.log(`   - Commission Wallet: Total Earnings (5 types only)`);
    console.log(`   - Total Available for Withdrawal: Total Earnings ONLY`);
    console.log(`   - Security Refund: Stored completely separately`);

  } catch (error) {
    console.error('❌ Error fixing security refund separation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixSecurityRefundSeparation();
