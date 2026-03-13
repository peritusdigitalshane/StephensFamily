import { NextResponse } from 'next/server';
import { getSessionWithPermissions, unauthorizedResponse } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();

  if (auth.session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const resets = await prisma.passwordReset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(resets);
  } catch (error) {
    console.error('Failed to fetch password resets:', error);
    return NextResponse.json({ error: 'Failed to fetch password resets' }, { status: 500 });
  }
}
