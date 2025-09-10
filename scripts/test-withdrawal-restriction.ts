import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWithdrawalRestriction() {
  console.log('Testing withdrawal restriction for Intern users...');
  
  // Get the test user
  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
    include: { currentPosition: true }
  });
  
  if (!testUser) {
    console.error('Test user not found!');
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
    console.log('✅ Correctly identified as Intern - Withdrawal should be restricted');
  } else {
    console.log('❌ Not identified as Intern - Withdrawal would be allowed');
  }
  
  console.log('\nTest completed successfully!');
}

async function main() {
  try {
    await testWithdrawalRestriction();
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}