import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { verifyPassword, createToken, setSessionCookie } from '@/lib/auth/utils';
import { eq } from 'drizzle-orm';

// Mock user for development
const MOCK_USER = {
  id: 'dev-user-1',
  email: 'demo@orbitpath.com',
  name: 'Demo User',
  password: '$2a$10$K2H8.uxFM9qrPi0zN5Z1a.X9FhKvL8J2N9M8L7K6J5H4G3F2E1D0',
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    // If database is not configured, use mock user for demo
    if (!db) {
      console.log('[OrbitPath] Using mock auth for development');
      
      // Accept demo credentials
      if (email === 'demo@orbitpath.com' && password === 'demo1234') {
        const token = await createToken(MOCK_USER.id);
        await setSessionCookie(token);

        return NextResponse.json(
          {
            success: true,
            user: { id: MOCK_USER.id, email: MOCK_USER.email, name: MOCK_USER.name },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid credentials. Use demo@orbitpath.com / demo1234' },
        { status: 401 }
      );
    }

    // Database login
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = result[0];

    // Verify password
    const passwordValid = await verifyPassword(password, user.password);

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[OrbitPath] Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
