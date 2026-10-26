import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ChildModel } from '@/models/Child';
import { ChildAccessModel } from '@/models/ChildAccess';
import { AACBoardModel } from '@/models/AACBoard';
import { createChildSchema } from '@/lib/validations/child';
import { logAuditEvent } from '@/lib/audit/logger';
import { defaultCategories, defaultVocabularyItems } from '@/features/aac/defaultVocabulary';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    await connectDB();

    if (session.role === 'tutor') {
      // Un tutor ve los niños que ha registrado directamente
      const children = await ChildModel.find({ tutorId: session.userId }).sort({ createdAt: -1 });
      return NextResponse.json({ children });
    }

    // Profesionales y docentes: solo ven los niños vinculados con estado 'accepted'
    const accesses = await ChildAccessModel.find({
      userId: session.userId,
      status: 'accepted',
    }).populate('childId');

    const children = accesses
      .filter((a) => a.childId)
      .map((a) => a.childId);

    return NextResponse.json({ children });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al consultar niños';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo los tutores pueden registrar perfiles infantiles
    if (session.role !== 'tutor') {
      return NextResponse.json(
        { error: 'Solo los tutores legales pueden crear perfiles infantiles' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createChildSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de perfil infantil inválidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    await connectDB();

    const newChild = await ChildModel.create({
      ...parsed.data,
      tutorId: session.userId,
    });

    // Crear automáticamente el tablero inicial SAAC personalizado para este niño
    await AACBoardModel.create({
      childId: newChild._id,
      name: `Tablero de ${newChild.nickname || newChild.name}`,
      isCustom: false,
      columnsCount: newChild.accessibility?.columnsCount || 4,
      categories: defaultCategories,
      items: defaultVocabularyItems,
    });

    await logAuditEvent({
      userId: session.userId,
      childId: newChild._id.toString(),
      action: 'CHILD_CREATED',
      resource: 'Child',
      details: { name: newChild.name },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(
      { message: 'Perfil infantil creado exitosamente', child: newChild },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear perfil infantil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
