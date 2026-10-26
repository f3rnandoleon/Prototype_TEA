import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { BatteryLogModel } from '@/models/BatteryLog';
import { ChildModel } from '@/models/Child';
import { authorizeChildAccess } from '@/lib/security/policies';

export async function GET(req: NextRequest) {
  try {
    const childId = req.nextUrl.searchParams.get('childId');
    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    await connectDB();

    // Si hay sesión de adulto, validamos permisos
    const session = await getSessionUser(req);
    if (session) {
      const auth = await authorizeChildAccess(session.userId, session.role, childId, 'observation.read');
      if (!auth.authorized) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
      }
    }

    const logs = await BatteryLogModel.find({ childId })
      .sort({ createdAt: -1 })
      .limit(30);

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar termómetro sensorial';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { childId, level, note, registeredBy } = body;

    if (!childId || !level) {
      return NextResponse.json({ error: 'childId y nivel son requeridos' }, { status: 400 });
    }

    await connectDB();
    const child = await ChildModel.findById(childId);
    if (!child) {
      return NextResponse.json({ error: 'Niño no encontrado' }, { status: 404 });
    }

    const session = await getSessionUser(req);

    const log = await BatteryLogModel.create({
      childId,
      level,
      note: note || '',
      registeredBy: session ? session.role : (registeredBy || 'child'),
      authorId: session?.userId,
      authorName: session?.name || 'Niño (Autorregistro)',
    });

    return NextResponse.json(
      { message: 'Estado registrado con éxito', log },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar estado de batería';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
