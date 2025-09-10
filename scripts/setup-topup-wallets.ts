import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

interface WalletSetup {
  walletType: 'JAZZCASH' | 'EASYPAISA';
  walletNumber: string;
  walletHolderName: string;
  isActive?: boolean;
}

async function setupTopupWallets() {
  console.log('🚀 Setting up Topup Management System...\n');

  try {
    // Default admin wallets to create
    const defaultWallets: WalletSetup[] = [
      {
        walletType: 'JAZZCASH',
        walletNumber: '03001234567',
        walletHolderName: 'Admin JazzCash Account',
        isActive: true
      },
      {
        walletType: 'EASYPAISA',
        walletNumber: '03009876543',
        walletHolderName: 'Admin EasyPaisa Account',
        isActive: true
      }
    ];

    console.log('Step 1: Checking existing admin wallets...');
    const existingWallets = await prisma.adminWallet.findMany();
    console.log(`Found ${existingWallets.length} existing admin wallets.\n`);

    // Create admin wallets if they don't exist
    console.log('Step 2: Creating default admin wallets...');
    for (const walletData of defaultWallets) {
      const existingWallet = await prisma.adminWallet.findFirst({
        where: {
          walletNumber: walletData.walletNumber,
          walletType: walletData.walletType
        }
      });

      if (!existingWallet) {
        const wallet = await prisma.adminWallet.create({
          data: walletData
        });
        console.log(`✅ Created ${walletData.walletType} wallet: ${walletData.walletNumber}`);
      } else {
        console.log(`⚡ ${walletData.walletType} wallet already exists: ${walletData.walletNumber}`);
      }
    }

    console.log('\nStep 3: Checking for admin user...');
    let adminUser = await prisma.adminUser.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!adminUser) {
      console.log('Creating default super admin user...');
      const hashedPassword = await bcryptjs.hash('admin123', 10);

      adminUser = await prisma.adminUser.create({
        data: {
          name: 'Super Admin',
          email: 'admin@example.com',
          phone: '03000000000',
          password: hashedPassword,
          role: 'SUPER_ADMIN'
        }
      });
      console.log('✅ Created super admin user');
      console.log('   Email: admin@example.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  IMPORTANT: Change the password after first login!');
    } else {
      console.log('⚡ Super admin user already exists');
    }

    console.log('\nStep 4: Creating sample test user...');
    let testUser = await prisma.user.findFirst({
      where: { phone: '03111111111' }
    });

    if (!testUser) {
      const hashedPassword = await bcryptjs.hash('user123', 10);

      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          phone: '03111111111',
          email: 'testuser@example.com',
          password: hashedPassword,
          referralCode: 'TESTUSER001',
          walletBalance: 0.0
        }
      });
      console.log('✅ Created test user');
      console.log('   Phone: 03111111111');
      console.log('   Password: user123');
    } else {
      console.log('⚡ Test user already exists');
    }

    console.log('\nStep 5: System verification...');

    // Verify admin wallets
    const walletCount = await prisma.adminWallet.count();
    const activeWalletCount = await prisma.adminWallet.count({
      where: { isActive: true }
    });

    // Verify users
    const adminCount = await prisma.adminUser.count();
    const userCount = await prisma.user.count();

    console.log('📊 System Status:');
    console.log(`   Admin Wallets: ${walletCount} total, ${activeWalletCount} active`);
    console.log(`   Admin Users: ${adminCount}`);
    console.log(`   Regular Users: ${userCount}`);

    // List all active wallets
    console.log('\n💳 Active Admin Wallets:');
    const activeWallets = await prisma.adminWallet.findMany({
      where: { isActive: true },
      orderBy: { walletType: 'asc' }
    });

    activeWallets.forEach((wallet, index) => {
      console.log(`   ${index + 1}. ${wallet.walletType}`);
      console.log(`      Number: ${wallet.walletNumber}`);
      console.log(`      Holder: ${wallet.walletHolderName}`);
      console.log(`      ID: ${wallet.id}`);
    });

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Login to admin panel: /admin/login');
    console.log('2. Update wallet details if needed: /admin/topup-management');
    console.log('3. Change default passwords for security');
    console.log('4. Test the topup flow: /top-up');
    console.log('\n✨ Your Topup Management System is ready to use!');

  } catch (error) {
    console.error('❌ Setup failed:', error);

    // Provide helpful error messages
    if (error.code === 'P2002') {
      console.error('💡 This looks like a unique constraint violation.');
      console.error('   Some data might already exist in your database.');
    }

    if (error.message.includes('connect')) {
      console.error('💡 Database connection failed.');
      console.error('   Please check your DATABASE_URL environment variable.');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Topup Management System Setup Script

Usage:
  npm run setup:topup-wallets
  bun run scripts/setup-topup-wallets.ts

Options:
  --help, -h     Show this help message
  --force        Force recreation of existing data
  --minimal      Create minimal setup only

Examples:
  bun run scripts/setup-topup-wallets.ts
  bun run scripts/setup-topup-wallets.ts --force

This script will:
- Create default admin wallets (JazzCash & EasyPaisa)
- Create a super admin user account
- Create a test user account
- Verify system configuration
- Display setup summary

⚠️  Always backup your database before running with --force
    `);
    return;
  }

  if (args.includes('--force')) {
    console.log('⚠️  Running in FORCE mode - this will recreate existing data');
    console.log('Continuing in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  await setupTopupWallets();
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for potential use in other scripts
export { setupTopupWallets };
