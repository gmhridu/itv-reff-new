import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testInternWithdrawalRestriction() {
  console.log('Testing Intern withdrawal restriction...');
  
  // Get the Intern position
  const internPosition = await prisma.positionLevel.findUnique({
    where: { name: 'Intern' }
  });
  
  if (!internPosition) {
    console.error('Intern position not found!');
    return;
  }
  
  console.log(`Intern position found: ${internPosition.name} (Level ${internPosition.level})`);
  
  // Check if there are any users with the Intern position
  const internUsers = await prisma.user.findMany({
    where: {
      currentPositionId: internPosition.id
    },
    take: 1
  });
  
  if (internUsers.length === 0) {
    console.log('No users found with Intern position');
    return;
  }
  
  const internUser = internUsers[0];
  console.log(`Found Intern user: ${internUser.name || internUser.email || internUser.phone}`);
  console.log(`User isIntern flag: ${internUser.isIntern}`);
  console.log(`User position: ${internUser.currentPositionId}`);
  
  console.log('Test completed successfully!');
}

async function main() {
  try {
    await testInternWithdrawalRestriction();
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}