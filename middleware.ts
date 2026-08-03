import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from './lib/admin-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Login page is public (still noindex via layout).
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !(await verifyAdminSessionToken(token))) {
    const login = new URL('/dashboard', request.url);
    login.searchParams.set('next', pathname);
    const res = NextResponse.redirect(login);
    if (token) {
      res.cookies.set(ADMIN_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
