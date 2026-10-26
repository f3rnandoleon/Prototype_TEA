import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { AuditLogModel } from '@/models/AuditLog';
import { ChildModel } from '@/models/Child';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    // Si filtra por niño, verificar que el usuario sea el tutor o tenga permisos
    if (childId) {
      const child = await ChildModel.findById(childId);
      if (!child || child.tutorId.toString() !== session.userId) {
        return NextResponse.json({ error: 'Acceso no autorizado a registros de auditoría' }, { status: 403 });
      }

      const logs = await AuditLogModel.find({ childId })
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .limit(100);

      return NextResponse.json({ logs });
    }

    // Auditoría general del usuario
    const logs = await AuditLogModel.find({ userId: session.userId })
      .sort({ timestamp: -1 })
      .limit(100);

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno de auditoría';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
