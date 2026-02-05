#!/bin/bash

# Test Billing & Token Gating System
# Run this after starting Aegis (npm run dev:server)

BASE_URL="http://localhost:8080"

echo "🧪 Testing Token Gating System"
echo "================================"
echo ""

# 1. Check initial usage
echo "📊 Step 1: Check initial usage (FREE tier, 0 tokens)"
curl -s "$BASE_URL/billing/usage" | jq
echo ""

# 2. Get all tiers
echo "💰 Step 2: Fetch all available tiers"
curl -s "$BASE_URL/billing/tiers" | jq '.tiers[] | {name, price, tokenLimit}'
echo ""

# 3. Test agent command (costs 50 tokens)
echo "🤖 Step 3: Send agent command (costs 50 tokens)"
curl -s -X POST "$BASE_URL/agents/command" \
  -H "Content-Type: application/json" \
  -d '{"agentId": 1, "task": "Test task"}' | jq
echo ""

# 4. Check usage after command
echo "📈 Step 4: Check usage after command"
curl -s "$BASE_URL/billing/usage" | jq '{usage, limit, percentage, remaining}'
echo ""

# 5. Simulate hitting limit (100 requests = 5,000 tokens)
echo "⚠️  Step 5: Simulating heavy usage..."
for i in {1..99}; do
  curl -s -X POST "$BASE_URL/agents/command" \
    -H "Content-Type: application/json" \
    -d "{\"agentId\": 1, \"task\": \"Task $i\"}" > /dev/null
done
echo "Sent 99 more requests"
echo ""

# 6. Check usage (should be at/near limit)
echo "🚨 Step 6: Check usage (should be near 5,000 limit)"
curl -s "$BASE_URL/billing/usage" | jq '{usage, limit, percentage, remaining}'
echo ""

# 7. Try one more request (should fail with 402)
echo "❌ Step 7: Try to exceed limit (should return 402)"
curl -s -X POST "$BASE_URL/agents/command" \
  -H "Content-Type: application/json" \
  -d '{"agentId": 1, "task": "This should fail"}' | jq
echo ""

# 8. Upgrade to STARTER tier
echo "⬆️  Step 8: Upgrade to STARTER tier (£18, 100k tokens)"
curl -s -X POST "$BASE_URL/billing/upgrade" \
  -H "Content-Type: application/json" \
  -d '{"tier": "STARTER"}' | jq
echo ""

# 9. Verify upgrade
echo "✅ Step 9: Verify new tier and limits"
curl -s "$BASE_URL/billing/usage" | jq '{tier, usage, limit, remaining}'
echo ""

# 10. Test command works again
echo "🟢 Step 10: Test command works after upgrade"
curl -s -X POST "$BASE_URL/agents/command" \
  -H "Content-Type: application/json" \
  -d '{"agentId": 2, "task": "Post-upgrade task"}' | jq '{success, message}'
echo ""

# 11. Reset usage
echo "🔄 Step 11: Reset usage (simulate monthly billing cycle)"
curl -s -X POST "$BASE_URL/billing/reset" | jq
curl -s "$BASE_URL/billing/usage" | jq '{tier, usage, limit, remaining}'
echo ""

echo "================================"
echo "✅ Test complete!"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:3000/pricing to see the pricing page"
echo "2. Add UsageIndicator component to your layout/sidebar"
echo "3. Integrate Stripe/Paddle for real payments"
