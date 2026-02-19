Set up a complete Stripe integration for a new product or price.

Product/feature to add: $ARGUMENTS

Tasks:
1. Read the existing Stripe setup (packages/web/src/lib/stripe.ts, packages/web/src/app/api/checkout/, packages/portal/app/services/stripe_service.py) to understand current patterns
2. Add the new product/price ID to the stripe config constants
3. Create or update the checkout API route to handle the new product
4. Add the webhook handler case if needed
5. Update the frontend pricing component or button to trigger the checkout
6. Update .env.local and .env.example with the new price ID variable (placeholder only in example)

Show the user exactly what to create in the Stripe Dashboard (product name, price, billing interval) and what env var to set.
