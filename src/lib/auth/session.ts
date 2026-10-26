import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { TokenPayload, verifyJWT } from './jwt';

export const AUTH_COOKIE_NAME = 'tea_session';

export async function getSessionUser(req?: NextRequest): Promise<TokenPayload | null> {
  let token: string | undefined;

  // 1. Verificar Authorization header
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // 2. Verificar cookie en request
  if (!token && req) {
    token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  }

  // 3. Fallback a next/headers cookies() si no se pasó request
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // Ignorar si está fuera del contexto de renderizado de Next.js
    }
  }

  if (!token) return null;
  return verifyJWT(token);
}

export function setAuthCookie(res: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 días
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
