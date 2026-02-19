import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';
import { stripe, PRICES, AMOUNTS } from '../../../lib/stripe';
import { prisma } from '../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();
    if (!plan || !['pro', 'lifetime'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Find or create DB user
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { subscription: true },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.firstName || undefined,
          subscription: { create: {} },
        },
        include: { subscription: true },
      });
    }

    // Get or create Stripe customer
    let customerId = dbUser.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: { userId: dbUser.id },
      });
      customerId = customer.id;

      await prisma.subscription.update({
        where: { userId: dbUser.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: plan === 'lifetime' ? 'payment' : 'subscription',
      line_items: [
        {
          price: PRICES[plan as keyof typeof PRICES],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        userId: dbUser.id,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
