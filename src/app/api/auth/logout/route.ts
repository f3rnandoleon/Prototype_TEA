import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, getSessionUser } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const response = NextResponse.json({ message: 'Sesión cerrada correctamente' });
    clearAuthCookie(response);

    if (user) {
      await logAuditEvent({
        userId: user.userId,
        action: 'AUTH_LOGOUT',
        resource: 'User',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      });
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al cerrar sesión';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
