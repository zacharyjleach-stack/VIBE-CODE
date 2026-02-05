# 🚀 Deployment Guide: Vercel + Railway + Stripe + Auth

## Overview

- **Frontend (Iris):** Vercel
- **Backend (Aegis):** Railway
- **Payments:** Stripe
- **Authentication:** Clerk (recommended) or Auth0

---

## 1️⃣ Deploy Backend (Railway)

### Step 1: Create Railway Account
1. Go to https://railway.app/
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"

### Step 2: Configure Environment Variables

In Railway dashboard, add these secrets:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
PORT=8080

# Optional
OPENAI_API_KEY=your_openai_key
GITHUB_TOKEN=your_github_token

# Railway provides Redis addon - use that URL
REDIS_URL=redis://default:password@redis.railway.internal:6379

# Stripe (add after Step 3)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL (add after deploying Vercel)
CORS_ORIGIN=https://your-app.vercel.app
```

### Step 3: Deploy

```bash
# Railway automatically detects your setup
# It will run: npm install && npm start

# Or manually specify:
# Build Command: npm install
# Start Command: cd server && npm start
```

**Your Aegis API will be live at:** `https://your-app.up.railway.app`

---

## 2️⃣ Deploy Frontend (Vercel)

### Step 1: Create Vercel Account
1. Go to https://vercel.com/
2. Sign up with GitHub
3. Click "Import Project" → Select your repo

### Step 2: Configure Build Settings

```bash
# Root Directory: client/iris
# Framework Preset: Next.js
# Build Command: npm run build
# Output Directory: .next
```

### Step 3: Add Environment Variables

In Vercel dashboard (Settings → Environment Variables):

```bash
# Aegis Backend URL (from Railway)
NEXT_PUBLIC_AEGIS_API_URL=https://your-app.up.railway.app
NEXT_PUBLIC_AEGIS_WS_URL=wss://your-app.up.railway.app
AEGIS_INTERNAL_URL=https://your-app.up.railway.app

# Clerk Authentication (see Step 3)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Stripe (public key only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Step 4: Deploy

Vercel will auto-deploy on every push to `main`.

**Your Iris frontend will be live at:** `https://your-app.vercel.app`

---

## 3️⃣ Add Authentication (Clerk)

### Why Clerk?
- Drop-in auth UI (no custom forms needed)
- Built-in user management dashboard
- Webhooks for user lifecycle events
- Free tier: 10,000 monthly active users

### Step 1: Create Clerk Account
1. Go to https://clerk.com/
2. Sign up and create new application
3. Choose: **Email + Google + GitHub** sign-in methods

### Step 2: Install Clerk

```bash
cd /workspaces/VIBE-CODE/client/iris
npm install @clerk/nextjs
```

### Step 3: Add Clerk Middleware

**File:** `client/iris/src/middleware.ts`

```typescript
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/pricing", "/api/webhooks/(.*)"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### Step 4: Wrap App with ClerkProvider

**File:** `client/iris/src/app/layout.tsx`

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Step 5: Add Sign In/Up Buttons

```typescript
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';

export default function Header() {
  const { isSignedIn, user } = useUser();

  return (
    <header>
      {isSignedIn ? (
        <>
          <span>Welcome, {user.firstName}!</span>
          <UserButton />
        </>
      ) : (
        <>
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </>
      )}
    </header>
  );
}
```

### Step 6: Protect API Routes

```typescript
import { auth } from '@clerk/nextjs';

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Continue with authenticated request...
}
```

---

## 4️⃣ Add Stripe Payments

### Step 1: Create Stripe Account
1. Go to https://stripe.com/
2. Create account and complete verification
3. Go to Developers → API Keys

### Step 2: Install Stripe

```bash
cd /workspaces/VIBE-CODE
npm install stripe @stripe/stripe-js
```

### Step 3: Create Stripe Products

In Stripe Dashboard (Products):

1. **Starter Plan**
   - Name: "Starter"
   - Price: £18/month
   - Recurring: Monthly
   - Copy Price ID: `price_1234...`

2. **Pro Plan**
   - Name: "Pro"
   - Price: £80/month
   - Copy Price ID: `price_5678...`

3. **Ultra Plan**
   - Name: "Ultra"
   - Price: £170/month
   - Copy Price ID: `price_9012...`

### Step 4: Create Checkout Endpoint

**File:** `server/src/billing/stripe.ts`

```typescript
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PRICE_IDS = {
  STARTER: 'price_1234...',  // From Stripe Dashboard
  PRO: 'price_5678...',
  ULTRA: 'price_9012...',
};

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tier } = await req.json();

  const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,
    payment_method_types: ['card'],
    line_items: [{
      price: PRICE_IDS[tier],
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.APP_URL}/pricing?canceled=true`,
    metadata: { userId, tier },
  });

  return Response.json({ url: session.url });
}
```

### Step 5: Update Pricing Page

**File:** `client/iris/src/app/pricing/page.tsx`

```typescript
const handleUpgrade = async (tierName: string) => {
  const response = await fetch('/api/billing/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: tierName.toUpperCase() })
  });

  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe Checkout
};
```

### Step 6: Add Webhook Handler

**File:** `server/src/api/webhooks/stripe.ts`

```typescript
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;

      // Upgrade user tier
      await prisma.user.update({
        where: { clerkId: session.metadata!.userId },
        data: {
          tier: session.metadata!.tier,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        }
      });
      break;

    case 'customer.subscription.deleted':
      // Downgrade to FREE
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { tier: 'FREE' }
      });
      break;
  }

  return Response.json({ received: true });
}
```

### Step 7: Configure Webhook in Stripe

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Events: Select:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy webhook signing secret → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## 5️⃣ Add Database (Recommended: Supabase)

### Why Supabase?
- PostgreSQL database
- Real-time subscriptions
- Built-in auth (alternative to Clerk)
- Free tier: 500MB database + 2GB bandwidth

### Step 1: Create Supabase Project
1. Go to https://supabase.com/
2. Create new project
3. Copy Database URL from Settings → Database

### Step 2: Install Prisma

```bash
cd /workspaces/VIBE-CODE/server
npm install prisma @prisma/client
npx prisma init
```

### Step 3: Database Schema

**File:** `server/prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                   String   @id @default(cuid())
  clerkId              String   @unique
  email                String   @unique
  tier                 String   @default("FREE")
  requestsToday        Int      @default(0)
  lastResetDate        DateTime @default(now())
  stripeCustomerId     String?
  stripeSubscriptionId String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

### Step 4: Push Schema

```bash
DATABASE_URL="postgresql://..." npx prisma db push
npx prisma generate
```

---

## 6️⃣ Environment Variables Checklist

### Railway (Backend)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
PORT=8080
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
```

### Vercel (Frontend)
```bash
NEXT_PUBLIC_AEGIS_API_URL=https://your-app.up.railway.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
AEGIS_INTERNAL_URL=https://your-app.up.railway.app
```

---

## 7️⃣ Post-Deployment Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Clerk authentication working
- [ ] Stripe checkout flow tested
- [ ] Webhook receiving events
- [ ] Database connected
- [ ] CORS configured (Railway allows Vercel domain)
- [ ] API key secured (not in git)
- [ ] Custom domain configured (optional)

---

## 🧪 Test Your Deployment

1. **Authentication:**
   - Visit `/pricing` → Click "Subscribe"
   - Should redirect to Clerk sign-in

2. **Stripe Payment:**
   - Complete sign-up → Click "Subscribe to Starter"
   - Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`

3. **Webhook:**
   - Complete payment → Check webhook logs in Stripe
   - Verify user tier updated in database

4. **API Protection:**
   - Make 10 requests on FREE tier
   - 11th request should return 402 error

---

## 📞 Support

**Clerk:** https://clerk.com/docs
**Stripe:** https://stripe.com/docs
**Railway:** https://docs.railway.app
**Vercel:** https://vercel.com/docs

Need help? Check BILLING_SYSTEM.md for detailed integration examples.
