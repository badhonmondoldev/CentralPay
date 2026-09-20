import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, authenticateAdmin, createAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const body = await request.json();
    const { email, identifier, password } = body;

    const loginIdentifier = email || identifier || 'admin';

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PASSWORD', message: 'পাসওয়ার্ড প্রদান করা আবশ্যক।' },
        { status: 400 }
      );
    }

    const authResult = await authenticateAdmin(loginIdentifier, password, ip);

    if (!authResult.success || !authResult.admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: authResult.error || 'ভুল তথ্য! সঠিক অ্যাডমিন পাসওয়ার্ড প্রদান করুন।',
        },
        { status: 401 }
      );
    }

    const sessionToken = await createAdminSession(authResult.admin.id, ip, userAgent);

    const response = NextResponse.json({
      success: true,
      message: 'অ্যাডমিন লগইন সফল হয়েছে!',
      admin: {
        id: authResult.admin.id,
        email: authResult.admin.email,
        name: authResult.admin.name,
        role: authResult.admin.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'SYSTEM_ERROR', message: (error as Error).message },
      { status: 500 }
    );
  }
}
