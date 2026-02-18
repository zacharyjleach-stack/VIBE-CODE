/**
 * StripeManager - Handles subscription and usage billing
 */

import Stripe from 'stripe';

export class StripeManager {
  private stripe: Stripe;
  private proPriceId: string;
  private visionMeterKey: string = 'vision_tokens';

  constructor(secretKey: string, proPriceId: string = '') {
    this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
    this.proPriceId = proPriceId;
  }

  async createCustomer(email: string, name?: string): Promise<string> {
    const customer = await this.stripe.customers.create({ email, name });
    return customer.id;
  }

  async createProSubscription(customerId: string): Promise<{
    subscriptionId: string;
    clientSecret: string;
    status: string;
  }> {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: this.proPriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret || '',
      status: subscription.status,
    };
  }

  async recordVisionUsage(subscriptionItemId: string, quantity: number): Promise<void> {
    await this.stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment',
    });
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<{
    active: boolean;
    tier: 'free' | 'pro';
    currentPeriodEnd: Date;
  }> {
    const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
    return {
      active: sub.status === 'active',
      tier: sub.status === 'active' ? 'pro' : 'free',
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  constructWebhookEvent(payload: Buffer, signature: string, webhookSecret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
