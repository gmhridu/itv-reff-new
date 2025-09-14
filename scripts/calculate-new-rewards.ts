import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function calculateNewRewards() {
  try {
    // Get all position levels
    const positions = await prisma.positionLevel.findMany({
      orderBy: { level: 'asc' }
    });

    console.log('Current reward structure (8%-3%-1%):');
    console.log('| Position | Deposit (PKR) | A-level (8%) | B-level (3%) | C-level (1%) |');
    console.log('|----------|---------------|--------------|--------------|--------------|');
    
    const currentRewards: any[] = [];
    
    for (const position of positions) {
      if (position.name === 'Intern') continue;
      
      const aLevel = position.deposit * 0.08;
      const bLevel = position.deposit * 0.03;
      const cLevel = position.deposit * 0.01;
      
      currentRewards.push({
        name: position.name,
        deposit: position.deposit,
        aLevel: Math.round(aLevel),
        bLevel: Math.round(bLevel),
        cLevel: Math.round(cLevel)
      });
      
      console.log(`| ${position.name} | ${position.deposit.toLocaleString()} | ${Math.round(aLevel).toLocaleString()} | ${Math.round(bLevel).toLocaleString()} | ${Math.round(cLevel).toLocaleString()} |`);
    }
    
    console.log('\nNew reward structure (10%-3%-1%):');
    console.log('| Position | Deposit (PKR) | A-level (10%) | B-level (3%) | C-level (1%) |');
    console.log('|----------|---------------|---------------|--------------|--------------|');
    
    const newRewards: any[] = [];
    
    for (const position of positions) {
      if (position.name === 'Intern') continue;
      
      const aLevel = position.deposit * 0.10;
      const bLevel = position.deposit * 0.03;
      const cLevel = position.deposit * 0.01;
      
      newRewards.push({
        name: position.name,
        deposit: position.deposit,
        aLevel: Math.round(aLevel),
        bLevel: Math.round(bLevel),
        cLevel: Math.round(cLevel)
      });
      
      console.log(`| ${position.name} | ${position.deposit.toLocaleString()} | ${Math.round(aLevel).toLocaleString()} | ${Math.round(bLevel).toLocaleString()} | ${Math.round(cLevel).toLocaleString()} |`);
    }
    
    console.log('\nComparison:');
    console.log('| Position | Current A (8%) | New A (10%) | Difference |');
    console.log('|----------|----------------|-------------|------------|');
    
    for (let i = 0; i < currentRewards.length; i++) {
      const current = currentRewards[i];
      const newItem = newRewards[i];
      const difference = newItem.aLevel - current.aLevel;
      
      console.log(`| ${current.name} | ${current.aLevel.toLocaleString()} | ${newItem.aLevel.toLocaleString()} | ${difference > 0 ? '+' : ''}${difference.toLocaleString()} |`);
    }
    
  } catch (error) {
    console.error('Error calculating rewards:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calculateNewRewards();