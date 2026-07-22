console.log('🔍 Simple Test Script Running...');

// Test basic JSON output
const testDeals = [
  {
    id: "test-deal-1",
    name: "Test Deal 1",
    category: "Developer Tools",
    pricing: "free",
    deal: "$100 Free Credit",
    code: "AUTO123",
    url: "https://example.com/test-deal",
    affiliate_url: "",
    tracking_id: "test-deal-1",
    has_affiliate: false,
    desc: "Test deal description for testing purposes.",
    tags: "test,free,credit",
    why: "Apply via example.com to get $100 free credit.",
    expires: null,
    rating: 8.5
  }
];

console.log('✅ Test script executed successfully');
console.log(`📊 Found ${testDeals.length} test deals`);

// Write to file for verification
const fs = require('fs').promises;

(async () => {
  await fs.writeFile('test-output.jsonl', testDeals.map(d => JSON.stringify(d)).join('\n') + '\n', 'utf-8');
  console.log('💾 Test output saved to test-output.jsonl');
})(); // End of script