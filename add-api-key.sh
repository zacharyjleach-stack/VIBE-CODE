#!/bin/bash

# Simple script to add your API key to .env file

clear
echo "🔑 Add Your Anthropic API Key"
echo "=============================="
echo ""
echo "⚠️  IMPORTANT: Make sure you've revoked the old key first!"
echo "   Go to: https://console.anthropic.com/settings/keys"
echo ""
echo "=============================="
echo ""
read -p "Paste your NEW Anthropic API key here: " API_KEY
echo ""

if [ -z "$API_KEY" ]; then
  echo "❌ No key entered. Exiting."
  exit 1
fi

if [[ ! $API_KEY =~ ^sk-ant-api03- ]]; then
  echo "⚠️  Warning: Key doesn't start with 'sk-ant-api03-'"
  echo "   Are you sure this is correct?"
  read -p "Continue anyway? (y/n): " CONFIRM
  if [ "$CONFIRM" != "y" ]; then
    echo "Cancelled."
    exit 1
  fi
fi

# Create .env file
cd /workspaces/VIBE-CODE
cat > .env << EOF
ANTHROPIC_API_KEY=$API_KEY
OPENAI_API_KEY=
GITHUB_TOKEN=
REDIS_URL=redis://localhost:6379
PORT=8080
EOF

echo ""
echo "✅ API key added to .env!"
echo ""
echo "Testing..."
node test-api-key.js 2>/dev/null || echo "   (test script not found, but key is saved)"
echo ""
echo "🚀 Next steps:"
echo "   1. Start backend: npm run dev:server"
echo "   2. Start frontend: cd client/iris && npm run dev"
echo "   3. Open: http://localhost:3000"
echo ""
