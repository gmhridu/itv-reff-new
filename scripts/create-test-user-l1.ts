import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createTestUserL1() {
  console.log('Creating test user with L1 position...');
  
  // Get the L1 position
  const l1Position = await prisma.positionLevel.findUnique({
    where: { name: 'L1' }
  });
  
  if (!l1Position) {
    console.error('L1 position not found!');
    return;
  }
  
  console.log(`L1 position found: ${l1Position.name} (Level ${l1Position.level})`);
  
  // Generate unique referral code
  function generateReferralCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // Password security functions
  async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
  
  const referralCode = generateReferralCode();
  
  // Create test user
  const testUser = await prisma.user.create({
    data: {
      phone: '+1234567891',
      name: 'Test User L1',
      email: 'testl1@example.com',
      password: await hashPassword('TestPass123!'),
      referralCode,
      currentPositionId: l1Position.id,
      positionStartDate: new Date(),
      isIntern: false,
      depositPaid: 2000,
      walletBalance: 1000, // Give some balance for testing
      commissionBalance: 500,
    }
  });
  
  console.log(`Test user with L1 position created successfully!`);
  console.log(`User ID: ${testUser.id}`);
  console.log(`User name: ${testUser.name}`);
  console.log(`User phone: ${testUser.phone}`);
  console.log(`User email: ${testUser.email}`);
  console.log(`User isIntern: ${testUser.isIntern}`);
  console.log(`User wallet balance: ${testUser.walletBalance}`);
  console.log(`User commission balance: ${testUser.commissionBalance}`);
}

async function main() {
  try {
    await createTestUserL1();
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}