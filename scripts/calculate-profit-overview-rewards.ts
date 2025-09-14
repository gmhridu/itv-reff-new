// Calculate new invitation reward values for profit overview component
const positionLevels = [
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

console.log('New invitation reward values (10%-3%-1%):');
console.log('Position | Income Ratio | A-Level (10%) | B-Level (3%) | C-Level (1%)');
console.log('---------|--------------|---------------|--------------|-------------');

for (const position of positionLevels) {
  const aLevel = Math.round(position.deposit * 0.10);
  const bLevel = Math.round(position.deposit * 0.03);
  const cLevel = Math.round(position.deposit * 0.01);
  
  console.log(`${position.name} | 10%-3%-1% | ${aLevel.toLocaleString()} | ${bLevel.toLocaleString()} | ${cLevel.toLocaleString()}`);
}