import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../../../lib/db';

function generateApiKey(): { fullKey: string; keyHash: string; keyPrefix: string } {
  const raw = `aegis_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(raw).digest('hex');
  const keyPrefix = raw.slice(0, 16) + '...';
  return { fullKey: raw, keyHash, keyPrefix };
}

// GET /api/keys — list all active keys for the user
export async function GET() {
  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser) return NextResponse.json({ keys: [] });

  const keys = await prisma.apiKey.findMany({
    where: { userId: dbUser.id, isRevoked: false },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
  });

  return NextResponse.json({ keys });
}

// POST /api/keys — create a new API key
export async function POST(request: NextRequest) {
  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await request.json().catch(() => ({ name: 'Default Key' }));

  // Find or create DB user
  let dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.firstName || undefined,
        subscription: { create: {} },
      },
    });
  }

  // Limit to 5 active keys
  const count = await prisma.apiKey.count({ where: { userId: dbUser.id, isRevoked: false } });
  if (count >= 5) {
    return NextResponse.json({ error: 'Maximum 5 active API keys allowed' }, { status: 400 });
  }

  const { fullKey, keyHash, keyPrefix } = generateApiKey();
  const keyName = name || 'Default Key';

  const created = await prisma.apiKey.create({
    data: {
      userId: dbUser.id,
      name: keyName,
      keyHash,
      keyPrefix,
    },
    select: { id: true, name: true, keyPrefix: true },
  });

  // Return the full key ONCE — it cannot be retrieved again
  return NextResponse.json({
    key: fullKey,
    id: created.id,
    name: created.name,
    keyPrefix: created.keyPrefix,
    message: 'Save this key now — it will not be shown again.',
  });
}
