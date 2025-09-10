import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('Checking users in database...');
  
  const userCount = await prisma.user.count();
  console.log(`Total users: ${userCount}`);
  
  if (userCount > 0) {
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isIntern: true,
        currentPositionId: true,
        walletBalance: true,
        commissionBalance: true,
      }
    });
    
    console.log('Sample users:');
    users.forEach(user => {
      console.log(`- ${user.name || user.email || user.phone} (Intern: ${user.isIntern}, Wallet: ${user.walletBalance}, Commission: ${user.commissionBalance})`);
    });
  }
  
  // Check Intern position
  const internPosition = await prisma.positionLevel.findUnique({
    where: { name: 'Intern' }
  });
  
  if (internPosition) {
    console.log(`\nIntern position: ${internPosition.name} (Level ${internPosition.level})`);
    
    const internUserCount = await prisma.user.count({
      where: {
        currentPositionId: internPosition.id
      }
    });
    
    console.log(`Users with Intern position: ${internUserCount}`);
  } else {
    console.log('Intern position not found!');
  }
}

async function main() {
  try {
    await checkUsers();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}