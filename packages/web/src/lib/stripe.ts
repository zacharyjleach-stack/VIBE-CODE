import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  lifetime: process.env.STRIPE_LIFETIME_PRICE_ID!,
};

export const AMOUNTS = {
  pro: 2000, // $20.00
  lifetime: 55000, // $550.00
};
