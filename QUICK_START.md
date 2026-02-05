# ⚡ Quick Start Guide

## 1️⃣ Add Your API Key (RIGHT NOW)

**CRITICAL:** Never share your API key publicly!

```bash
# Edit this file:
nano /workspaces/VIBE-CODE/.env

# Add your NEW Anthropic API key:
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_NEW_KEY_HERE
```

**Test it works:**
```bash
cd /workspaces/VIBE-CODE
node test-api-key.js
```

Should see: `✅ API key detected in .env`

---

## 2️⃣ Run Locally (Development)

```bash
# Terminal 1: Start Backend (Aegis)
cd /workspaces/VIBE-CODE
npm run dev:server

# Terminal 2: Start Frontend (Iris)
cd /workspaces/VIBE-CODE/client/iris
npm run dev

# Open: http://localhost:3000
```

**Test the billing system:**
```bash
./scripts/test-billing.sh
```

---

## 3️⃣ Deploy to Production

### Option A: Automated Setup
```bash
./scripts/deploy-setup.sh
```

### Option B: Manual Setup
Follow: `DEPLOYMENT_GUIDE.md`

**Deployment Stack:**
- **Frontend:** Vercel (https://vercel.com)
- **Backend:** Railway (https://railway.app)
- **Auth:** Clerk (https://clerk.com)
- **Payments:** Stripe (https://stripe.com)
- **Database:** Supabase (https://supabase.com) [Optional]

---

## 4️⃣ Secure Your Keys

### ✅ DO:
- Add keys to `.env` files (gitignored)
- Use Railway/Vercel environment variables for production
- Revoke old keys immediately if exposed

### ❌ DON'T:
- Commit `.env` to git
- Share keys in chat/Slack/Discord
- Store keys in code files
- Use production keys in development

---

## 📖 Documentation

- **Architecture:** `PROJECT_DNA.md`
- **Billing System:** `BILLING_SYSTEM.md`
- **Deployment:** `DEPLOYMENT_GUIDE.md`

---

## 🧪 Testing

```bash
# Test billing limits
./scripts/test-billing.sh

# Test API endpoints
curl http://localhost:8080/health
curl http://localhost:8080/billing/usage

# Test frontend
open http://localhost:3000/pricing
```

---

## 🆘 Troubleshooting

**API key not working?**
- Check it starts with `sk-ant-api03-`
- Verify no extra spaces in `.env`
- Restart server after adding key

**Can't connect to backend?**
- Check Aegis is running on port 8080
- Verify `NEXT_PUBLIC_AEGIS_API_URL` in `client/iris/.env.local`

**Billing not working?**
- Check `UsageManager` is imported in `server/src/index.ts`
- Verify routes are using `canMakeRequest()`

---

## 🚀 Next Steps

1. ✅ Add API key to `.env`
2. ✅ Test locally
3. ⏭️ Deploy to Vercel + Railway
4. ⏭️ Add Clerk authentication
5. ⏭️ Connect Stripe payments
6. ⏭️ Set up custom domain
7. ⏭️ Launch! 🎉

**Need help?** Read `DEPLOYMENT_GUIDE.md` for detailed instructions.
