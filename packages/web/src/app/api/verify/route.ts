import { NextRequest, NextResponse } from 'next/server';
import { checkAccess, spendTokens, TOKEN_COSTS } from '../../../lib/tokens';
import { prisma } from '../../../lib/db';

// POST /api/verify - The Token Sentry endpoint
// Called by Aegis CLI/HUD before each AI action
export async function POST(request: NextRequest) {
  try {
    const { apiKey, action, projectId } = await request.json();

    if (!apiKey || !action) {
      return NextResponse.json({ error: 'Missing apiKey or action' }, { status: 400 });
    }

    if (!TOKEN_COSTS[action as keyof typeof TOKEN_COSTS]) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find user by API key
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: { keyHash: apiKey, isRevoked: false },
      include: { user: true },
    });

    if (!apiKeyRecord) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Spend tokens
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
        upgradeUrl: 'https://aegis.dev/billing',
      }, { status: 402 }); // Payment Required
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

// GET /api/verify - Check access without spending
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }

  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: { keyHash: apiKey, isRevoked: false },
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
