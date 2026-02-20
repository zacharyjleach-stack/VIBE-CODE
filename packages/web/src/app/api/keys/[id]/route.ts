import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/db';

// DELETE /api/keys/[id] — revoke a key
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Verify the key belongs to this user before revoking
  const key = await prisma.apiKey.findFirst({
    where: { id: params.id, userId: dbUser.id },
  });

  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

  await prisma.apiKey.update({
    where: { id: params.id },
    data: { isRevoked: true },
  });

  return NextResponse.json({ success: true });
}
