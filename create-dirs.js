const fs = require('fs');
const path = require('path');

const dirs = [
  'src/types/domain',
  'src/types/api',
  'src/services',
  'src/services/__tests__',
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
  console.log('✓ Created: ' + dir);
});

console.log('\nAll directories created successfully!');
