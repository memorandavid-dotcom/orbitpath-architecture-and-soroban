import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth/utils';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Mock user for development
const MOCK_USER = {
  id: 'dev-user-1',
  email: 'demo@orbitpath.com',
  name: 'Demo User',
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // If database is not configured, return mock user
    if (!db) {
      return NextResponse.json(
        { user: MOCK_USER },
        { status: 200 }
      );
    }

    // Database lookup
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { user: result[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('[OrbitPath] Me endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
