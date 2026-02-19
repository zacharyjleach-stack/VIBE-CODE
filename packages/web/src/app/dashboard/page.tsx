import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/db';
import { DashboardClient } from '../../components/DashboardClient';

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  let dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    include: {
      subscription: true,
      tokenLedger: { orderBy: { createdAt: 'desc' }, take: 20 },
      apiKeys: { where: { isRevoked: false } },
    },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.firstName || undefined,
        tokenBalance: 5000,
        subscription: { create: {} },
      },
      include: {
        subscription: true,
        tokenLedger: { orderBy: { createdAt: 'desc' }, take: 20 },
        apiKeys: { where: { isRevoked: false } },
      },
    });
  }

  return (
    <DashboardClient
      user={{
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        balance: dbUser.tokenBalance,
        isLifetime: dbUser.lifetimeLicense,
        plan: dbUser.subscription?.plan || 'free',
        status: dbUser.subscription?.status || 'trialing',
      }}
      history={dbUser.tokenLedger}
      apiKeys={dbUser.apiKeys.map(k => ({ id: k.id, name: k.name, prefix: k.keyPrefix, createdAt: k.createdAt }))}
    />
  );
}
