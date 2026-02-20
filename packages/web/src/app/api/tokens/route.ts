import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/db';

// GET /api/tokens - Get user's token balance and history
export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    include: {
      subscription: true,
      tokenLedger: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    balance: dbUser.tokenBalance,
    isLifetime: dbUser.lifetimeLicense,
    plan: dbUser.subscription?.plan || 'free',
    status: dbUser.subscription?.status || 'trialing',
    history: dbUser.tokenLedger.map(t => ({
      id: t.id,
      type: t.type,
      action: t.action,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      description: t.description,
      createdAt: t.createdAt,
    })),
  });
}
