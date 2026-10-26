import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { PlanChangeModel } from '@/models/PlanChange';
import { authorizeChildAccess } from '@/lib/security/policies';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(req: NextRequest) {
  try {
    const childId = req.nextUrl.searchParams.get('childId');
    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    await connectDB();

    // Buscar si hay un cambio de plan activo reciente
    const activeChange = await PlanChangeModel.findOne({ childId, isActive: true })
      .sort({ createdAt: -1 });

    return NextResponse.json({ activeChange });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar cambio de planes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { childId, routineId, originalActivity, newTask, nextTask, childOptions, reasonNotes } = body;

    if (!childId || !originalActivity || !newTask) {
      return NextResponse.json(
        { error: 'childId, originalActivity y newTask son requeridos' },
        { status: 400 }
      );
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'routine.update');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No autorizado' }, { status: 403 });
    }

    await connectDB();

    // Desactivar cambios activos anteriores de este niño
    await PlanChangeModel.updateMany({ childId, isActive: true }, { isActive: false });

    const planChange = await PlanChangeModel.create({
      childId,
      routineId,
      originalActivity,
      newTask,
      nextTask: nextTask || '',
      childOptions: childOptions || [],
      reasonNotes: reasonNotes || '',
      isActive: true,
      announcedAt: new Date(),
      createdBy: session.userId,
    });

    await logAuditEvent({
      userId: session.userId,
      childId,
      action: 'PLAN_CHANGE_ANNOUNCED',
      resource: 'PlanChange',
      details: { originalActivity, newTask },
    });

    return NextResponse.json(
      { message: 'Cambio de planes anunciado al niño', planChange },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar cambio de planes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    await connectDB();
    const updated = await PlanChangeModel.findByIdAndUpdate(
      id,
      { isActive: isActive !== undefined ? isActive : false },
      { new: true }
    );

    return NextResponse.json({ message: 'Estado de cambio de planes actualizado', updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar cambio de planes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
