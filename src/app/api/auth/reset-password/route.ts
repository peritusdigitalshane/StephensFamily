import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@/lib/sanitize';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 });
    }

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json({ valid: false, error: 'Invalid reset token' });
    }

    if (resetRecord.used) {
      return NextResponse.json({ valid: false, error: 'This reset token has already been used' });
    }

    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json({ valid: false, error: 'This reset token has expired' });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ valid: false, error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    // Validate the token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 });
    }

    if (resetRecord.used) {
      return NextResponse.json({ error: 'This reset token has already been used' }, { status: 400 });
    }

    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json({ error: 'This reset token has expired' }, { status: 400 });
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // Hash the new password and update the user
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    // Mark the token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
