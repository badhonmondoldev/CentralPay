import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, isValidSession } from '@/lib/auth';

export async function GET() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = await isValidSession(sessionToken);

  return NextResponse.json({ authenticated });
}
