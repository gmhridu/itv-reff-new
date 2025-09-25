/**
 * Database Fix Script: Remove Security Refunds from Current Balance
 *
 * This script corrects existing wallet balances where security refunds
 * were incorrectly added to the current balance.
 *
 * Run this script to fix the database:
 * node scripts/fix-wallet-balances.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixWalletBalances() {
  console.log('🔧 Starting wallet balance correction...');

  try {
    // Get all users with approved security refunds
    const usersWithRefunds = await prisma.user.findMany({
      where: {
        securityRefundRequests: {
          some: {
            status: 'APPROVED'
          }
        }
      },
      include: {
        securityRefundRequests: {
          where: {
            status: 'APPROVED'
          }
        }
      }
    });

    console.log(`📊 Found ${usersWithRefunds.length} users with approved security refunds`);

    for (const user of usersWithRefunds) {
      // Calculate total approved security refunds
      const totalSecurityRefunds = user.securityRefundRequests.reduce(
        (sum, refund) => sum + refund.refundAmount,
        0
      );

      if (totalSecurityRefunds > 0) {
        console.log(`\n👤 User: ${user.id}`);
        console.log(`   Current wallet balance: ${user.walletBalance}`);
        console.log(`   Total security refunds: ${totalSecurityRefunds}`);

        // Calculate correct wallet balance (remove security refunds)
        const correctWalletBalance = user.walletBalance - totalSecurityRefunds;

        console.log(`   Corrected wallet balance: ${correctWalletBalance}`);

        // Update the wallet balance
        await prisma.user.update({
          where: { id: user.id },
          data: {
            walletBalance: correctWalletBalance
          }
        });

        console.log(`   ✅ Updated wallet balance for user ${user.id}`);
      }
    }

    console.log('\n🎉 Wallet balance correction completed!');
    console.log('💡 Note: Security refunds are now available for withdrawal only');

  } catch (error) {
    console.error('❌ Error fixing wallet balances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixWalletBalances()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
