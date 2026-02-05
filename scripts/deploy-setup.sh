#!/bin/bash

# 🚀 Deployment Setup Script
# Automates the setup of Stripe, Clerk, and deployment configs

set -e

echo "🚀 VIBE-CODE Deployment Setup"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ .env file not found${NC}"
  echo "Please create .env file first with your ANTHROPIC_API_KEY"
  exit 1
fi

# Load .env
export $(cat .env | grep -v '^#' | xargs)

# Check API key
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your_new_key_here" ]; then
  echo -e "${RED}❌ ANTHROPIC_API_KEY not set in .env${NC}"
  echo "Please add your Anthropic API key to .env file"
  exit 1
fi

echo -e "${GREEN}✅ .env file configured${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo ""
echo "🔧 Setting up integrations..."
echo ""

# Clerk setup
echo -e "${YELLOW}1️⃣  CLERK AUTHENTICATION${NC}"
echo "   Go to: https://clerk.com/"
echo "   1. Sign up and create application"
echo "   2. Copy your keys:"
read -p "   Enter NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or press Enter to skip): " CLERK_PUB_KEY
read -p "   Enter CLERK_SECRET_KEY (or press Enter to skip): " CLERK_SECRET_KEY

if [ ! -z "$CLERK_PUB_KEY" ]; then
  echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUB_KEY" >> client/iris/.env.local
  echo "CLERK_SECRET_KEY=$CLERK_SECRET_KEY" >> client/iris/.env.local
  echo -e "   ${GREEN}✅ Clerk keys added${NC}"
else
  echo -e "   ${YELLOW}⏭️  Skipped - add later${NC}"
fi

echo ""

# Stripe setup
echo -e "${YELLOW}2️⃣  STRIPE PAYMENTS${NC}"
echo "   Go to: https://stripe.com/"
echo "   1. Create account"
echo "   2. Go to Developers → API Keys"
read -p "   Enter STRIPE_SECRET_KEY (or press Enter to skip): " STRIPE_SECRET
read -p "   Enter NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (or press Enter to skip): " STRIPE_PUB

if [ ! -z "$STRIPE_SECRET" ]; then
  echo "STRIPE_SECRET_KEY=$STRIPE_SECRET" >> .env
  echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUB" >> client/iris/.env.local
  echo -e "   ${GREEN}✅ Stripe keys added${NC}"
else
  echo -e "   ${YELLOW}⏭️  Skipped - add later${NC}"
fi

echo ""

# Railway setup
echo -e "${YELLOW}3️⃣  RAILWAY DEPLOYMENT (Backend)${NC}"
echo "   Go to: https://railway.app/"
echo "   1. Sign up with GitHub"
echo "   2. New Project → Deploy from GitHub"
echo "   3. Select your repo"
echo "   4. Add environment variables (copy from .env)"
echo ""
read -p "   Press Enter when Railway is deployed..."
read -p "   Enter your Railway URL (e.g., https://your-app.up.railway.app): " RAILWAY_URL

if [ ! -z "$RAILWAY_URL" ]; then
  echo "NEXT_PUBLIC_AEGIS_API_URL=$RAILWAY_URL" >> client/iris/.env.local
  echo "NEXT_PUBLIC_AEGIS_WS_URL=wss://${RAILWAY_URL#https://}" >> client/iris/.env.local
  echo "AEGIS_INTERNAL_URL=$RAILWAY_URL" >> client/iris/.env.local
  echo -e "   ${GREEN}✅ Railway URL configured${NC}"
fi

echo ""

# Vercel setup
echo -e "${YELLOW}4️⃣  VERCEL DEPLOYMENT (Frontend)${NC}"
echo "   Go to: https://vercel.com/"
echo "   1. Sign up with GitHub"
echo "   2. Import Project → Select your repo"
echo "   3. Root Directory: client/iris"
echo "   4. Add environment variables from client/iris/.env.local"
echo ""
read -p "   Press Enter when Vercel is deployed..."

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Configure Stripe products (see DEPLOYMENT_GUIDE.md)"
echo "3. Set up Stripe webhooks"
echo "4. Install Clerk SDK: cd client/iris && npm install @clerk/nextjs"
echo "5. Push to GitHub to trigger Vercel deployment"
echo ""
echo "📖 Full guide: ./DEPLOYMENT_GUIDE.md"
