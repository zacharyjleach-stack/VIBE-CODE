import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { checkAccess, spendTokens, TOKEN_COSTS } from '../../../lib/tokens';
import { prisma } from '../../../lib/db';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// POST /api/verify — Token Sentry: spend tokens for an action
export async function POST(request: NextRequest) {
  try {
    const { apiKey, action, projectId } = await request.json();

    if (!apiKey || !action) {
      return NextResponse.json({ error: 'Missing apiKey or action' }, { status: 400 });
    }

    if (!(action in TOKEN_COSTS)) {
      return NextResponse.json({ error: `Invalid action. Valid actions: ${Object.keys(TOKEN_COSTS).join(', ')}` }, { status: 400 });
    }

    // Hash raw key before DB lookup (was missing before — critical bug fix)
    const keyHash = hashKey(apiKey);

    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: { keyHash, isRevoked: false },
      include: { user: true },
    });

    if (!apiKeyRecord) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    const result = await spendTokens(
      apiKeyRecord.userId,
      action as keyof typeof TOKEN_COSTS,
      projectId
    );

    if (!result.success) {
      return NextResponse.json({
        allowed: false,
        balance: result.newBalance,
        message: result.message,
        upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      }, { status: 402 });
    }

    return NextResponse.json({
      allowed: true,
      balance: result.newBalance,
      tokensUsed: TOKEN_COSTS[action as keyof typeof TOKEN_COSTS],
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/verify — Check access without spending tokens
export async function GET(request: NextRequest) {
  const rawKey = request.headers.get('x-api-key');
  if (!rawKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }

  const keyHash = hashKey(rawKey);

  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: { keyHash, isRevoked: false },
    include: { user: { include: { subscription: true } } },
  });

  if (!apiKeyRecord) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const access = await checkAccess(apiKeyRecord.userId);

  return NextResponse.json({
    allowed: access.allowed,
    balance: access.balance,
    isLifetime: access.isLifetime,
    plan: access.plan,
  });
}
