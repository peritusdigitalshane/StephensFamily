import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithPermissions, unauthorizedResponse } from '@/lib/permissions';

export async function GET() {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();

  try {
    const users = await prisma.user.findMany({
      where: { approved: true },
      select: { id: true, name: true, role: true, color: true, avatar: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Members GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
