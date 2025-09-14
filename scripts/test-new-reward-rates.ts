// Test the new reward rates directly
const REWARD_RATES: any = {
  L1: { A: 200, B: 60, C: 20 },
  L2: { A: 500, B: 150, C: 50 },
  L3: { A: 2000, B: 600, C: 200 },
  L4: { A: 5000, B: 1500, C: 500 },
  L5: { A: 10000, B: 3000, C: 1000 },
  L6: { A: 25000, B: 7500, C: 2500 },
  L7: { A: 50000, B: 15000, C: 5000 },
  L8: { A: 100000, B: 30000, C: 10000 },
  L9: { A: 200000, B: 60000, C: 20000 },
  L10: { A: 400000, B: 120000, C: 40000 },
  L11: { A: 800000, B: 240000, C: 80000 }
};

console.log('Testing new reward rates (10%-3%-1% structure):');
console.log('Position | Deposit   | A-Level (10%) | B-Level (3%) | C-Level (1%) | Verification');
console.log('---------|-----------|---------------|--------------|--------------|-------------');

const positions = [
  { name: 'L1', deposit: 2000 },
  { name: 'L2', deposit: 5000 },
  { name: 'L3', deposit: 20000 },
  { name: 'L4', deposit: 50000 },
  { name: 'L5', deposit: 100000 },
  { name: 'L6', deposit: 250000 },
  { name: 'L7', deposit: 500000 },
  { name: 'L8', deposit: 1000000 },
  { name: 'L9', deposit: 2000000 },
  { name: 'L10', deposit: 4000000 },
  { name: 'L11', deposit: 8000000 },
];

for (const position of positions) {
  const aLevel = REWARD_RATES[position.name].A;
  const bLevel = REWARD_RATES[position.name].B;
  const cLevel = REWARD_RATES[position.name].C;
  
  const expectedALevel = position.deposit * 0.10;
  const expectedBLevel = position.deposit * 0.03;
  const expectedCLevel = position.deposit * 0.01;
  
  const aLevelCorrect = aLevel === expectedALevel ? '✅' : '❌';
  const bLevelCorrect = bLevel === expectedBLevel ? '✅' : '❌';
  const cLevelCorrect = cLevel === expectedCLevel ? '✅' : '❌';
  
  console.log(
    `${position.name.padEnd(8)} | ${position.deposit.toString().padEnd(9)} | ${aLevel.toString().padEnd(13)} | ${bLevel.toString().padEnd(12)} | ${cLevel.toString().padEnd(12)} | ${aLevelCorrect} ${bLevelCorrect} ${cLevelCorrect}`
  );
}

console.log('\n✅ Reward rates verification completed!');