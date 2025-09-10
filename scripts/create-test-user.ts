import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('Creating test user with Intern position...');
  
  // Get the Intern position
  const internPosition = await prisma.positionLevel.findUnique({
    where: { name: 'Intern' }
  });
  
  if (!internPosition) {
    console.error('Intern position not found!');
    return;
  }
  
  console.log(`Intern position found: ${internPosition.name} (Level ${internPosition.level})`);
  
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
      phone: '+1234567890',
      name: 'Test User',
      email: 'test@example.com',
      password: await hashPassword('TestPass123!'),
      referralCode,
      currentPositionId: internPosition.id,
      positionStartDate: new Date(),
      isIntern: true,
      depositPaid: 0,
      walletBalance: 1000, // Give some balance for testing
      commissionBalance: 500,
    }
  });
  
  console.log(`Test user created successfully!`);
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
    await createTestUser();
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}