import { prisma } from './db';

export const TOKEN_COSTS = {
  vibe_check: 100,
  context_sync: 10,
  agent_relay: 5,
};

export async function checkAccess(userId: string): Promise<{
  allowed: boolean;
  balance: number;
  isLifetime: boolean;
  plan: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    return { allowed: false, balance: 0, isLifetime: false, plan: 'none' };
  }

  // Lifetime license = unlimited access
  if (user.lifetimeLicense) {
    return { allowed: true, balance: user.tokenBalance, isLifetime: true, plan: 'lifetime' };
  }

  // Active Pro subscription = unlimited access
  if (user.subscription?.status === 'active' && user.subscription?.plan === 'pro') {
    return { allowed: true, balance: user.tokenBalance, isLifetime: false, plan: 'pro' };
  }

  // Free tier = check balance
  return {
    allowed: user.tokenBalance > 0,
    balance: user.tokenBalance,
    isLifetime: false,
    plan: 'free',
  };
}

export async function spendTokens(
  userId: string,
  action: keyof typeof TOKEN_COSTS,
  projectId?: string
): Promise<{ success: boolean; newBalance: number; message?: string }> {
  const cost = TOKEN_COSTS[action];
  const access = await checkAccess(userId);

  if (!access.allowed) {
    return { success: false, newBalance: 0, message: 'Trial expired. Please upgrade.' };
  }

  if (access.isLifetime || access.plan === 'pro') {
    // Paid users — record action but do not deduct tokens
    await prisma.tokenLedger.create({
      data: {
        userId,
        type: 'debit',
        action,
        amount: 0,
        balanceAfter: access.balance,
        projectId,
        description: `${action} (paid plan)`,
      },
    });
    return { success: true, newBalance: access.balance };
  }

  // Free tier — deduct tokens
  if (access.balance < cost) {
    return { success: false, newBalance: access.balance, message: 'Insufficient tokens. Please upgrade.' };
  }

  const newBalance = access.balance - cost;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { tokenBalance: newBalance },
    }),
    prisma.tokenLedger.create({
      data: {
        userId,
        type: 'debit',
        action,
        amount: cost,
        balanceAfter: newBalance,
        projectId,
        description: `${action} (−${cost} tokens)`,
      },
    }),
  ]);

  return { success: true, newBalance };
}
