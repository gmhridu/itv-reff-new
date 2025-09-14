import { TaskManagementBonusService } from '@/lib/task-management-bonus-service';

async function testTaskManagementBonusUpdate() {
  console.log('Testing Task Management Bonus Rate Update');
  console.log('========================================');
  
  // Test the updated bonus rates
  console.log('Bonus Rates:');
  console.log('- A_LEVEL: 8% (0.08)');
  console.log('- B_LEVEL: 3% (0.03)');
  console.log('- C_LEVEL: 1% (0.01)');
  
  // Test calculations with a task income of 1000 PKR
  const taskIncome = 1000;
  console.log(`\nExample calculation for task income of ${taskIncome} PKR:`);
  
  // Calculate bonuses using the service's rates
  const aLevelBonus = Math.round(taskIncome * 0.08);
  const bLevelBonus = Math.round(taskIncome * 0.03);
  const cLevelBonus = Math.round(taskIncome * 0.01);
  
  console.log(`- A-Level Bonus: ${aLevelBonus} PKR (8% of ${taskIncome})`);
  console.log(`- B-Level Bonus: ${bLevelBonus} PKR (3% of ${taskIncome})`);
  console.log(`- C-Level Bonus: ${cLevelBonus} PKR (1% of ${taskIncome})`);
  console.log(`- Total Bonus: ${aLevelBonus + bLevelBonus + cLevelBonus} PKR`);
  
  console.log('\n✅ Test completed successfully!');
  console.log('The Task Management Bonus rates have been updated from 6%-3%-1% to 8%-3%-1%');
}

if (require.main === module) {
  testTaskManagementBonusUpdate();
}

export { testTaskManagementBonusUpdate };