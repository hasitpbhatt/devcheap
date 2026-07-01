const fs = require('fs');

// Test if deals.json is valid JSON
try {
  const data = JSON.parse(fs.readFileSync('data/deals.json', 'utf8'));
  console.log('✅ deals.json is valid JSON');
  console.log('✅ Total deals:', data.length);
  console.log('✅ First deal:', data[0].name);
} catch (err) {
  console.error('❌ Invalid JSON:', err.message);
  process.exit(1);
}

// Test if we can fetch it via file protocol
const path = require('path');
const dealsPath = path.join(__dirname, 'data', 'deals.json');
console.log('📁 File path:', dealsPath);
console.log('📁 File exists:', fs.existsSync(dealsPath));
console.log('📁 File size:', fs.statSync(dealsPath).size, 'bytes');