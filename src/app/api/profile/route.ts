import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sanitizeString, validatePassword } from '@/lib/sanitize';

// PATCH - update profile (name, color)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  try {
    const { name, color } = await req.json();
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      const sanitized = sanitizeString(name, 50);
      if (sanitized.length < 1) {
        return NextResponse.json({ error: 'Name must be 1-50 characters' }, { status: 400 });
      }
      updateData.name = sanitized;
    }
    if (color !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
        return NextResponse.json({ error: 'Invalid colour format' }, { status: 400 });
      }
      updateData.color = color;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, color: true, avatar: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// PUT - change password
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new password are required' }, { status: 400 });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
