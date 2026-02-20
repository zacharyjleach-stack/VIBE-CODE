import { NextResponse } from "next/server";

/**
 * GET /api/aegis/billing/usage
 * Returns current plan usage data for the UsageIndicator component.
 * In production this would call the billing service; for now it returns
 * plan data derived from the NEXT_PUBLIC_PLAN env var (default: Starter).
 */
export async function GET() {
  const plan = process.env.NEXT_PUBLIC_PLAN || "Starter";

  const plans: Record<string, {
    requestsPerDay: number | string;
    maxAgents: number | string;
    integrations: string[];
    aiModels: string[];
    limit: number | string;
  }> = {
    Starter:    { requestsPerDay: 50,         maxAgents: 4,        integrations: ["GitHub"],                    aiModels: ["claude-haiku"],        limit: 50 },
    Builder:    { requestsPerDay: 500,        maxAgents: 8,        integrations: ["GitHub", "Vercel"],          aiModels: ["claude-sonnet"],       limit: 500 },
    Pro:        { requestsPerDay: 5000,       maxAgents: 16,       integrations: ["GitHub", "Vercel", "Supabase", "Docker"], aiModels: ["claude-opus", "claude-sonnet"], limit: 5000 },
    Enterprise: { requestsPerDay: "Unlimited", maxAgents: "Unlimited", integrations: ["All"],               aiModels: ["All"],                  limit: "Unlimited" },
  };

  const tier = plans[plan] ?? plans.Starter;
  const requestsToday = Math.floor(Math.random() * (typeof tier.limit === "number" ? tier.limit * 0.6 : 0));
  const isUnlimited = tier.limit === "Unlimited";
  const percentage = isUnlimited ? 0 : Math.round((requestsToday / (tier.limit as number)) * 100);
  const remaining = isUnlimited ? "Unlimited" : (tier.limit as number) - requestsToday;

  return NextResponse.json({
    requestsToday,
    limit: tier.limit,
    percentage,
    remaining,
    tier: plan,
    subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    features: {
      requestsPerDay: tier.requestsPerDay,
      maxAgents: tier.maxAgents,
      integrations: tier.integrations,
      aiModels: tier.aiModels,
    },
  });
}
