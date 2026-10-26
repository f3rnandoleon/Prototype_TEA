import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { UserModel } from '@/models/User';
import { verifyPassword } from '@/lib/auth/password';
import { signJWT } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validations/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Credenciales inválidas', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    await connectDB();

    const user = await UserModel.findOne({ email });
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Credenciales inválidas o cuenta deshabilitada' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const token = await signJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
      },
    });

    setAuthCookie(response, token);

    await logAuditEvent({
      userId: user._id.toString(),
      action: 'AUTH_LOGIN',
      resource: 'User',
      details: { email: user.email },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
