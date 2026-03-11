import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sanitizeString, validatePassword } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const sanitizedName = sanitizeString(name, 50);
    if (!sanitizedName) {
      return NextResponse.json({ error: 'Valid name is required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name: sanitizedName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'pending',
        approved: false,
        avatar: sanitizedName.charAt(0).toUpperCase(),
      },
    });

    return NextResponse.json({ message: 'Registration successful! Please wait for admin approval.' });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
