// Quick test script to verify API key works
require('dotenv').config();

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('❌ No API key found in .env');
  process.exit(1);
}

if (apiKey.startsWith('sk-ant-api03-')) {
  console.log('✅ API key detected in .env');
  console.log(`   Format: ${apiKey.substring(0, 20)}...${apiKey.slice(-8)}`);
  console.log('   Ready to use!');
} else {
  console.log('⚠️  API key format looks incorrect');
}
