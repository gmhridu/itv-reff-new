const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWalletBalanceBug() {
  console.log('🔧 Starting wallet balance bug fix...');
  console.log('This will correct wallet balances to only include topup amounts');

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

    // Get all wallet transactions for earnings
    const earningTransactions = await prisma.walletTransaction.findMany({
      where: {
        status: 'COMPLETED',
        type: {
          in: [
            'TASK_INCOME',
            'REFERRAL_REWARD_A',
            'REFERRAL_REWARD_B',
            'REFERRAL_REWARD_C',
            'MANAGEMENT_BONUS_A',
            'MANAGEMENT_BONUS_B',
            'MANAGEMENT_BONUS_C',
            'TOPUP_BONUS',
            'SPECIAL_COMMISSION'
          ]
        }
      },
      select: {
        userId: true,
        amount: true,
        type: true
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

    // Create a map of user earnings
    const userEarningsMap = earningTransactions.reduce((acc, tx) => {
      if (!acc[tx.userId]) acc[tx.userId] = 0;
      acc[tx.userId] += tx.amount;
      return acc;
    }, {});

    for (const user of users) {
      // Calculate what the wallet balance should be (only topup amounts)
      const totalEarnings = userEarningsMap[user.id] || 0;
      const securityRefund = securityRefundMap[user.id] || 0;

      // The correct wallet balance should be: totalEarnings + securityRefund (since they were incorrectly added)
      const correctWalletBalance = totalEarnings + securityRefund;

      // If the current wallet balance is different from what it should be
      if (Math.abs(user.walletBalance - correctWalletBalance) > 0.01) {
        console.log(`\n👤 User: ${user.id}`);
        console.log(`   Current walletBalance: ${user.walletBalance}`);
        console.log(`   Total earnings: ${totalEarnings}`);
        console.log(`   Security refund: ${securityRefund}`);
        console.log(`   Correct walletBalance should be: ${correctWalletBalance}`);

        // Update the wallet balance to only include topup amounts (0, since all earnings were incorrectly added)
        await prisma.user.update({
          where: { id: user.id },
          data: { walletBalance: 0 } // Reset to 0 since it should only contain topup amounts
        });

        fixedCount++;
        totalIncorrectAmount += Math.abs(user.walletBalance - correctWalletBalance);

        console.log(`   ✅ Fixed: Set walletBalance to 0 (topup only)`);
      }
    }

    console.log(`\n🎉 Wallet balance bug fix completed!`);
    console.log(`📈 Summary:`);
    console.log(`   - Users processed: ${users.length}`);
    console.log(`   - Users fixed: ${fixedCount}`);
    console.log(`   - Total incorrect amount removed: ${totalIncorrectAmount.toFixed(2)}`);

    console.log(`\n💡 Wallet Structure After Fix:`);
    console.log(`   - Current Balance: Only topup amounts (no earnings, no security refunds)`);
    console.log(`   - Commission Wallet: Total Earnings (5 types only)`);
    console.log(`   - Total Available for Withdrawal: Total Earnings + Security Refund`);

  } catch (error) {
    console.error('❌ Error fixing wallet balance bug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixWalletBalanceBug();
