import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { UserModel } from '@/models/User';
import { hashPassword } from '@/lib/auth/password';
import { signJWT } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/session';
import { registerSchema } from '@/lib/validations/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de registro inválidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, role, specialty } = parsed.data;

    await connectDB();

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta registrada con este correo electrónico' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await UserModel.create({
      name,
      email,
      passwordHash,
      role,
      specialty: specialty || undefined,
      isActive: true,
    });

    const token = await signJWT({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const response = NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          specialty: newUser.specialty,
        },
      },
      { status: 201 }
    );

    setAuthCookie(response, token);

    await logAuditEvent({
      userId: newUser._id.toString(),
      action: 'AUTH_REGISTER',
      resource: 'User',
      details: { email: newUser.email, role: newUser.role },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
