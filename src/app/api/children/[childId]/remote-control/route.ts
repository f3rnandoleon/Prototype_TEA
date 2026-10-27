import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ChildSessionControlModel } from '@/models/ChildSessionControl';
import { ChildModel } from '@/models/Child';
import { authorizeChildAccess } from '@/lib/security/policies';

interface RouteParams {
  params: {
    childId: string;
  };
}

// GET: Obtener estado de control remoto o sincronizar latido del niño
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { childId } = params;
    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const isChildQuery = searchParams.get('role') === 'child';

    // 1. Petición proveniente de la Tablet / Modo Niño
    if (isChildQuery) {
      const currentRoute = searchParams.get('route') || '';
      const currentSection = searchParams.get('section') || 'Modo Infantil';

      const sessionControl = await ChildSessionControlModel.findOneAndUpdate(
        { childId },
        {
          $set: {
            lastHeartbeat: new Date(),
            currentRoute,
            currentSection,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return NextResponse.json({
        activeCommand: sessionControl?.activeCommand || null,
        locked: sessionControl?.locked || false,
      });
    }

    // 2. Petición proveniente del Tutor / Adulto Autorizado
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const auth = await authorizeChildAccess(
      session.userId,
      session.role,
      childId,
      'child.profile.read'
    );
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Acceso denegado' }, { status: 403 });
    }

    const sessionControl = await ChildSessionControlModel.findOne({ childId });

    const isOnline = Boolean(
      sessionControl?.lastHeartbeat &&
        Date.now() - new Date(sessionControl.lastHeartbeat).getTime() < 12000
    );

    return NextResponse.json({
      sessionControl: sessionControl || {
        childId,
        lastHeartbeat: null,
        currentRoute: '',
        currentSection: 'Desconectado',
        activeCommand: null,
        locked: false,
      },
      isOnline,
    });
  } catch (error: any) {
    console.error('Error en GET /api/children/[childId]/remote-control:', error);
    return NextResponse.json(
      { error: 'Error interno al consultar control remoto' },
      { status: 500 }
    );
  }
}

// POST: Enviar comando remoto desde el Tutor hacia el dispositivo del niño
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { childId } = params;
    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const auth = await authorizeChildAccess(
      session.userId,
      session.role,
      childId,
      'child.profile.read'
    );
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const { action, targetRoute, message, speakVoice, locked } = body;

    if (!action) {
      return NextResponse.json({ error: 'Acción requerida' }, { status: 400 });
    }

    await connectDB();

    const activeCommand = {
      commandId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action,
      targetRoute: targetRoute || undefined,
      message: message || undefined,
      speakVoice: speakVoice !== false,
      locked: locked || false,
      createdAt: new Date(),
      executedAt: null,
    };

    const updateData: any = {
      activeCommand,
    };

    if (typeof locked === 'boolean') {
      updateData.locked = locked;
    }

    const updated = await ChildSessionControlModel.findOneAndUpdate(
      { childId },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      activeCommand,
      locked: updated.locked,
    });
  } catch (error: any) {
    console.error('Error en POST /api/children/[childId]/remote-control:', error);
    return NextResponse.json(
      { error: 'Error al enviar comando de control remoto' },
      { status: 500 }
    );
  }
}

// PUT: Confirmar que el comando fue ejecutado en el dispositivo del niño
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { childId } = params;
    const body = await req.json();
    const { commandId } = body;

    await connectDB();

    if (commandId) {
      await ChildSessionControlModel.findOneAndUpdate(
        { childId, 'activeCommand.commandId': commandId },
        {
          $set: {
            'activeCommand.executedAt': new Date(),
          },
        }
      );
    } else {
      await ChildSessionControlModel.findOneAndUpdate(
        { childId },
        {
          $set: {
            'activeCommand.executedAt': new Date(),
          },
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en PUT /api/children/[childId]/remote-control:', error);
    return NextResponse.json({ error: 'Error al confirmar comando' }, { status: 500 });
  }
}
