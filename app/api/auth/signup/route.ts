import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { hashPassword, createToken, setSessionCookie, generateId } from '@/lib/auth/utils';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    // Validate input
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // If database is not configured, allow signup in mock mode
    if (!db) {
      console.log('[OrbitPath] Using mock signup for development');
      
      const userId = generateId();
      const token = await createToken(userId);
      await setSessionCookie(token);

      return NextResponse.json(
        {
          success: true,
          user: { id: userId, email, name },
        },
        { status: 201 }
      );
    }

    // Database signup
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = generateId();
    await db.insert(users).values({
      id: userId,
      email,
      name,
      password: hashedPassword,
    });

    // Create session token
    const token = await createToken(userId);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        user: { id: userId, email, name },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[OrbitPath] Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
