/**
 * Comprehensive Wallet Balance Fix Script
 *
 * This script performs a complete wallet balance correction:
 * 1. Fixes existing wallet balances (removes security refunds)
 * 2. Updates totalEarnings to match actual transaction data
 * 3. Provides detailed reporting
 *
 * Run this script to completely fix wallet data:
 * node scripts/comprehensive-wallet-fix.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveWalletFix() {
  console.log('🔧 Starting comprehensive wallet balance correction...');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        securityRefundRequests: {
          where: { status: 'APPROVED' }
        },
        transactions: {
          where: { status: 'COMPLETED' }
        }
      }
    });

    console.log(`📊 Found ${users.length} users to process`);

    let fixedUsers = 0;
    let totalSecurityRefunds = 0;
    let totalEarningsDiscrepancies = 0;

    for (const user of users) {
      let needsUpdate = false;
      const updates = {};

      // 1. Calculate actual total earnings from transactions (5 types only)
      const earningTransactions = user.transactions.filter(t =>
        ['TASK_INCOME', 'REFERRAL_REWARD_A', 'REFERRAL_REWARD_B', 'REFERRAL_REWARD_C',
         'MANAGEMENT_BONUS_A', 'MANAGEMENT_BONUS_B', 'MANAGEMENT_BONUS_C',
         'TOPUP_BONUS', 'SPECIAL_COMMISSION'].includes(t.type)
      );

      const actualTotalEarnings = earningTransactions.reduce((sum, t) => sum + t.amount, 0);

      // 2. Calculate total security refunds
      const totalSecurityRefund = user.securityRefundRequests.reduce(
        (sum, refund) => sum + refund.refundAmount, 0
      );

      // 3. Check if wallet balance needs correction (remove security refunds)
      const correctWalletBalance = user.walletBalance - totalSecurityRefund;

      // 4. Check if totalEarnings needs correction
      const earningsDiscrepancy = Math.abs(user.totalEarnings - actualTotalEarnings);

      if (totalSecurityRefund > 0) {
        console.log(`\n👤 User: ${user.id} (${user.phone})`);
        console.log(`   Current wallet balance: ${user.walletBalance}`);
        console.log(`   Total security refunds: ${totalSecurityRefund}`);
        console.log(`   Corrected wallet balance: ${correctWalletBalance}`);
        console.log(`   Current totalEarnings: ${user.totalEarnings}`);
        console.log(`   Calculated totalEarnings: ${actualTotalEarnings}`);
        console.log(`   Earnings discrepancy: ${earningsDiscrepancy}`);

        // Update wallet balance if it includes security refunds
        if (user.walletBalance !== correctWalletBalance) {
          updates.walletBalance = correctWalletBalance;
          needsUpdate = true;
          console.log(`   ✅ Will correct wallet balance`);
        }

        // Update totalEarnings if there's a discrepancy
        if (earningsDiscrepancy > 0.01) {
          updates.totalEarnings = actualTotalEarnings;
          needsUpdate = true;
          console.log(`   ✅ Will correct totalEarnings`);
        }

        if (needsUpdate) {
          await prisma.user.update({
            where: { id: user.id },
            data: updates
          });

          console.log(`   ✅ Updated user ${user.id}`);
          fixedUsers++;
          totalSecurityRefunds += totalSecurityRefund;
          totalEarningsDiscrepancies += earningsDiscrepancy;
        } else {
          console.log(`   ✅ No corrections needed`);
        }
      }
    }

    console.log('\n🎉 Comprehensive wallet correction completed!');
    console.log(`📈 Summary:`);
    console.log(`   - Users processed: ${users.length}`);
    console.log(`   - Users fixed: ${fixedUsers}`);
    console.log(`   - Total security refunds removed: ${totalSecurityRefunds}`);
    console.log(`   - Total earnings discrepancies: ${totalEarningsDiscrepancies.toFixed(2)}`);

    console.log('\n💡 Wallet Structure After Fix:');
    console.log('   - Current Balance: Only topup amounts (no security refunds)');
    console.log('   - Commission Wallet: Total Earnings (5 types only)');
    console.log('   - Total Available for Withdrawal: Total Earnings + Security Refund');

  } catch (error) {
    console.error('❌ Error in comprehensive wallet fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
comprehensiveWalletFix()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
