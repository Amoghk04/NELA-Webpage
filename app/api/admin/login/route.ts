import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
} from '@/lib/admin-session';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
).replace(/\/$/, '');

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;
  if (!body?.password) {
    return NextResponse.json({ message: 'Password required' }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE}/v1/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: body.password }),
  });

  const data = (await upstream.json().catch(() => ({}))) as {
    token?: string;
    expiresIn?: number;
    message?: string;
  };

  if (!upstream.ok || !data.token) {
    return NextResponse.json(
      { message: data.message ?? 'Invalid admin password' },
      { status: upstream.status || 401 },
    );
  }

  const res = NextResponse.json({ ok: true, expiresIn: data.expiresIn ?? 0 });
  res.cookies.set(
    ADMIN_COOKIE_NAME,
    data.token,
    adminCookieOptions(data.expiresIn ?? 60 * 60 * 12),
  );
  return res;
}
