import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/sanitize';
import { ROLES } from '@/lib/roles';

// GET all users (admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        color: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PATCH - update user role/approval
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }

  try {
    const { userId, role, approved, color, name } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent superadmin from changing their own role
    if (userId === session.user.id && role !== undefined) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const validRoles = ROLES.map((r) => r.value);
    const updateData: Record<string, unknown> = {};
    if (role !== undefined) {
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updateData.role = role;
    }
    if (approved !== undefined) updateData.approved = Boolean(approved);
    if (color !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
        return NextResponse.json({ error: 'Invalid colour format' }, { status: 400 });
      }
      updateData.color = color;
    }
    if (name !== undefined) {
      const sanitized = sanitizeString(name, 50);
      if (sanitized.length < 1) {
        return NextResponse.json({ error: 'Valid name is required' }, { status: 400 });
      }
      updateData.name = sanitized;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        color: true,
        avatar: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - remove user
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
