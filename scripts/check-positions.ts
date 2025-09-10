import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPositionLevels() {
  const positions = await prisma.positionLevel.findMany({ 
    orderBy: { 
      level: 'asc' 
    } 
  });
  
  console.log('Current position levels:');
  positions.forEach(pos => {
    console.log(`${pos.name}: Level ${pos.level}, Deposit ${pos.deposit}, Tasks/Day ${pos.tasksPerDay}, Unit Price ${pos.unitPrice}`);
  });
  
  await prisma.$disconnect();
}

checkPositionLevels();