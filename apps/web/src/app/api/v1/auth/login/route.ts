import { NextResponse } from 'next/server';
import { ADMIN_PASSWORD, AUTH_COOKIE_NAME, generateSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CREDENTIALS', message: 'ভুল পাসওয়ার্ড! সঠিক অ্যাডমিন পাসওয়ার্ড প্রদান করুন।' },
        { status: 401 }
      );
    }

    const sessionToken = await generateSessionToken();

    const response = NextResponse.json({
      success: true,
      message: 'অ্যাডমিন লগইন সফল হয়েছে!',
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days session
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'SYSTEM_ERROR', message: (error as Error).message },
      { status: 500 }
    );
  }
}
