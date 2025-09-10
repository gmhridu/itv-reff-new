import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testL1Withdrawal() {
  console.log('Testing withdrawal for L1 user...');
  
  // Get the L1 test user
  const testUser = await prisma.user.findUnique({
    where: { email: 'testl1@example.com' },
    include: { currentPosition: true }
  });
  
  if (!testUser) {
    console.error('L1 test user not found!');
    return;
  }
  
  console.log(`Test user: ${testUser.name} (${testUser.email})`);
  console.log(`User position: ${testUser.currentPosition?.name || 'None'}`);
  console.log(`Is Intern: ${testUser.isIntern}`);
  console.log(`Wallet balance: ${testUser.walletBalance}`);
  console.log(`Commission balance: ${testUser.commissionBalance}`);
  
  // Test the logic we implemented in the withdrawal routes
  const isIntern = testUser.isIntern || (testUser.currentPosition && testUser.currentPosition.name === "Intern");
  
  if (isIntern) {
    console.log('❌ Identified as Intern - Withdrawal should be restricted');
  } else {
    console.log('✅ Correctly identified as non-Intern - Withdrawal should be allowed');
  }
  
  console.log('\nTest completed successfully!');
}

async function main() {
  try {
    await testL1Withdrawal();
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}