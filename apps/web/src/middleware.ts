import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, isValidSession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Helper function to apply security headers to any response
  const applySecurityHeaders = (response: NextResponse) => {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'self';"
    );
    return response;
  };

  // 2. Define Public Routes that bypass admin authentication
  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/pay/') ||
    pathname.startsWith('/api/v1/payments/') ||
    pathname.startsWith('/api/v1/payment-requests') ||
    pathname.startsWith('/api/v1/device/') ||
    pathname.startsWith('/api/v1/download/') ||
    pathname.startsWith('/api/v1/auth/') ||
    pathname === '/health' ||
    pathname === '/api/health' ||
    pathname === '/docs' ||
    pathname === '/centralpay-agent.apk' ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    /\.(svg|png|jpg|jpeg|gif|webp|apk|ico)$/i.test(pathname);

  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await isValidSession(sessionCookie);

  // 3. If already authenticated and trying to visit /login, redirect to /dashboard
  if (pathname === '/login') {
    if (isAuthenticated) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 4. Allow public routes
  if (isPublic) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 5. Protect all dashboard/admin routes
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // 6. If visiting root '/' while authenticated, redirect to /dashboard
  if (pathname === '/') {
    return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
