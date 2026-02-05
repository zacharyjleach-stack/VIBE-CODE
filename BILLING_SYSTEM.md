# 💳 Subscription Billing System

## Overview

Protects your API keys from abuse using **simple subscription tiers** with daily request limits. No token counting, no usage anxiety.

## Architecture

```
User Request → Daily Limit Check → Allow/Deny (402)
                      ↓
            UsageManager.canMakeRequest()
                      ↓
            Auto-resets at midnight
```

## Pricing Tiers

| Tier | Price | Requests/Day | Agents | AI Models | Integrations |
|------|-------|--------------|--------|-----------|--------------|
| **Free** | £0/mo | 10 | 1 | Haiku | None |
| **Starter** | £18/mo | 100 | 4 | Haiku, Sonnet | GitHub, VS Code |
| **Pro** | £80/mo | 1,000 | 16 | All | All |
| **Ultra** | £170/mo | ∞ Unlimited | ∞ Unlimited | All | All + Custom |

## Key Features

### 1. Daily Request Limits
- Automatically reset at midnight (local server time)
- No monthly tracking or rollover
- Ultra tier = truly unlimited

### 2. Agent Limits
- Free users can only use Agent #1
- Starter: Agents #1-4
- Pro: Agents #1-16
- Ultra: All agents + custom swarms

### 3. Feature Gating
- Integration access based on tier
- AI model selection restricted by tier
- Ultra tier unlocks white-label options

## Backend API

### Get Usage
```bash
GET /billing/usage
```

Response:
```json
{
  "userId": "mock-user-1",
  "tier": "FREE",
  "requestsToday": 5,
  "limit": 10,
  "percentage": 50.0,
  "remaining": 5,
  "lastResetDate": "2026-02-05T00:00:00Z",
  "subscriptionEnd": "2026-03-05T...",
  "features": {
    "requestsPerDay": 10,
    "maxAgents": 1,
    "integrations": [],
    "aiModels": ["claude-haiku"]
  }
}
```

### Get All Tiers
```bash
GET /billing/tiers
```

### Upgrade Tier
```bash
POST /billing/upgrade
Content-Type: application/json

{
  "tier": "STARTER"
}
```

Response:
```json
{
  "success": true,
  "message": "Upgraded to STARTER plan",
  "user": {
    "tier": "STARTER",
    "requestsPerDay": 100,
    "maxAgents": 4,
    "requestsToday": 5,
    "subscriptionEnd": "2026-03-05T..."
  }
}
```

### Reset Daily Usage
```bash
POST /billing/reset
```

## Frontend Components

### Pricing Page
- **Location:** `/pricing`
- **File:** `client/iris/src/app/pricing/page.tsx`
- **Features:**
  - 4 glassmorphism cards showing daily limits
  - Infinity icon for Ultra tier
  - "No usage anxiety" messaging
  - One-click mock upgrades

### Usage Indicator
- **File:** `client/iris/src/components/UsageIndicator.tsx`
- **Features:**
  - Shows "X / Y requests today"
  - Color-coded: Green → Amber → Red
  - Infinity display for Ultra tier
  - Agent limit badge
  - Auto-polls every 30s

## Error Handling

### Daily Limit Exceeded (402)
```json
HTTP 402 Payment Required
{
  "error": "Upgrade Required",
  "message": "Daily request limit exceeded (10/10). Please upgrade your plan.",
  "currentTier": "FREE",
  "requestsToday": 10,
  "limit": 10,
  "upgradeUrl": "/pricing"
}
```

### Agent Limit Exceeded (403)
```json
HTTP 403 Forbidden
{
  "error": "Agent Limit Exceeded",
  "message": "Your FREE plan allows up to 1 concurrent agent.",
  "currentTier": "FREE",
  "maxAgents": 1,
  "requestedAgent": 3,
  "upgradeUrl": "/pricing"
}
```

## Feature Access Checks

### Check Integration Access
```typescript
import { UsageManager } from '@/server/src/billing/UsageManager';

// Before enabling GitHub integration
if (!UsageManager.hasIntegration('github')) {
  return res.status(403).json({
    error: "Integration not available on your plan",
    upgradeUrl: "/pricing"
  });
}
```

### Check AI Model Access
```typescript
// Before making Claude Opus API call
if (!UsageManager.hasAIModel('claude-opus')) {
  return res.status(403).json({
    error: "This AI model requires Pro or Ultra plan",
    upgradeUrl: "/pricing"
  });
}
```

## Testing

### Manual Test Flow
```bash
# 1. Start Aegis
npm run dev:server

# 2. Check initial usage (FREE, 0 requests)
curl http://localhost:8080/billing/usage | jq

# 3. Make 10 requests (hit FREE limit)
for i in {1..10}; do
  curl -X POST http://localhost:8080/agents/command \
    -H "Content-Type: application/json" \
    -d '{"agentId": 1, "task": "Test"}'
done

# 4. Try 11th request (should fail with 402)
curl -X POST http://localhost:8080/agents/command \
  -H "Content-Type: application/json" \
  -d '{"agentId": 1, "task": "Should fail"}'

# 5. Upgrade to STARTER
curl -X POST http://localhost:8080/billing/upgrade \
  -H "Content-Type: application/json" \
  -d '{"tier": "STARTER"}'

# 6. Now you can make 100 requests/day
curl http://localhost:8080/billing/usage | jq

# 7. Reset daily counter (for testing)
curl -X POST http://localhost:8080/billing/reset
```

## Integration with Chat

Add subscription checks to your chat endpoint:

```typescript
// In client/iris/src/app/api/chat/route.ts
import { UsageManager } from '@/server/src/billing/UsageManager';

export async function POST(req: Request) {
  // Check daily limit
  if (!UsageManager.canMakeRequest()) {
    return Response.json(
      {
        error: "Daily limit exceeded",
        message: "You've used all your requests today. Upgrade for more!",
        upgradeUrl: "/pricing"
      },
      { status: 402 }
    );
  }

  // Check model access
  const requestedModel = 'claude-opus';
  if (!UsageManager.hasAIModel(requestedModel)) {
    return Response.json(
      {
        error: "Model not available",
        message: "Claude Opus requires Pro or Ultra plan",
        upgradeUrl: "/pricing"
      },
      { status: 403 }
    );
  }

  // Proceed with AI call...
}
```

## Adding UsageIndicator to Layout

```tsx
// In client/iris/src/app/layout.tsx
import UsageIndicator from '@/components/UsageIndicator';

export default function RootLayout({ children }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r border-white/10 p-4">
        <UsageIndicator />
        {/* Other sidebar content */}
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

## Production Setup

### 1. Replace Mock User with Database

```typescript
// Use Prisma or any ORM
import { prisma } from '@/lib/prisma';

export class UsageManager {
  static async canMakeRequest(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    // Check daily reset
    if (isNewDay(user.lastResetDate)) {
      await prisma.user.update({
        where: { id: userId },
        data: { requestsToday: 0, lastResetDate: new Date() }
      });
      user.requestsToday = 0;
    }

    const tier = TIERS[user.subscription.tier];

    if (tier.requestsPerDay === 0) return true; // Unlimited

    if (user.requestsToday >= tier.requestsPerDay) {
      return false;
    }

    // Increment
    await prisma.user.update({
      where: { id: userId },
      data: { requestsToday: user.requestsToday + 1 }
    });

    return true;
  }
}
```

### 2. Database Schema (Prisma)

```prisma
model User {
  id               String       @id @default(cuid())
  email            String       @unique
  subscription     Subscription @relation(fields: [subscriptionId], references: [id])
  subscriptionId   String
  requestsToday    Int          @default(0)
  lastResetDate    DateTime     @default(now())
  createdAt        DateTime     @default(now())
}

model Subscription {
  id                    String   @id @default(cuid())
  tier                  String   @default("FREE") // FREE, STARTER, PRO, ULTRA
  status                String   @default("active") // active, canceled, expired
  currentPeriodStart    DateTime @default(now())
  currentPeriodEnd      DateTime
  stripeCustomerId      String?
  stripeSubscriptionId  String?
  users                 User[]
}
```

### 3. Stripe Integration

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session
app.post('/billing/create-checkout', async (req, res) => {
  const { tier, userId } = req.body;

  const priceIds = {
    STARTER: 'price_1234...',
    PRO: 'price_5678...',
    ULTRA: 'price_9012...'
  };

  const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,
    payment_method_types: ['card'],
    line_items: [{
      price: priceIds[tier],
      quantity: 1
    }],
    mode: 'subscription',
    success_url: `${process.env.APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.APP_URL}/pricing?canceled=true`,
    metadata: { userId, tier }
  });

  res.json({ url: session.url });
});

// Stripe webhook handler
app.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Update user tier in database
      await prisma.subscription.update({
        where: { userId: session.metadata.userId },
        data: {
          tier: session.metadata.tier,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription
        }
      });
      break;

    case 'customer.subscription.deleted':
      // Downgrade to FREE
      const subscription = event.data.object;
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { tier: 'FREE', status: 'canceled' }
      });
      break;
  }

  res.json({ received: true });
});
```

### 4. Daily Reset Cron Job

```typescript
import cron from 'node-cron';

// Run at midnight every day
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Resetting daily usage counters...');

  await prisma.user.updateMany({
    data: {
      requestsToday: 0,
      lastResetDate: new Date()
    }
  });

  console.log('[Cron] ✅ Daily reset complete');
});
```

## Why Subscription > Token Counting?

| Token Model | Subscription Model |
|-------------|-------------------|
| ❌ Unpredictable costs | ✅ Fixed monthly price |
| ❌ Usage anxiety | ✅ Peace of mind |
| ❌ Complex to explain | ✅ Simple pricing |
| ❌ Monthly tracking needed | ✅ Daily auto-reset |
| ❌ "How much did I use?" | ✅ "How many left today?" |

## Support & Troubleshooting

**User can't make requests on FREE tier?**
- Check if they've exceeded 10/day limit
- Run `/billing/reset` to reset counter (testing only)
- Verify midnight reset is working

**Agent #5 not working on STARTER plan?**
- STARTER only allows agents 1-4
- User needs PRO (16 agents) or ULTRA (unlimited)

**Integration toggle grayed out?**
- Check `UsageManager.hasIntegration(name)`
- Upgrade to tier that includes that integration

**Daily limit not resetting?**
- Verify cron job is running
- Check `lastResetDate` in database
- Server timezone must match expected reset time

## License & Attribution

Built for Iris & Aegis platform.
Subscription model implemented 2026-02-05.
Created with Claude Code (Sonnet 4.5).
