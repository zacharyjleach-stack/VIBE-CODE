import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '../../../lib/stripe';
import { prisma } from '../../../lib/db';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (!userId) break;

      if (plan === 'lifetime') {
        // Lifetime purchase
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { lifetimeLicense: true },
          }),
          prisma.subscription.update({
            where: { userId },
            data: {
              status: 'lifetime',
              plan: 'lifetime',
              lifetimePurchasedAt: new Date(),
              lifetimeAmount: 55000,
            },
          }),
        ]);
      } else {
        // Pro subscription
        await prisma.subscription.update({
          where: { userId },
          data: {
            status: 'active',
            plan: 'pro',
            stripeSubscriptionId: session.subscription as string,
          },
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const dbSub = await prisma.subscription.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (dbSub) {
        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: 'cancelled', plan: 'free' },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
