import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/utils';

export async function POST(request: NextRequest) {
  try {
    await clearSessionCookie();

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('[OrbitPath] Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
