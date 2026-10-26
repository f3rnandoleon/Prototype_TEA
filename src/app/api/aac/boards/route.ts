import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { AACBoardModel } from '@/models/AACBoard';
import { ChildModel } from '@/models/Child';
import { authorizeChildAccess } from '@/lib/security/policies';
import { defaultCategories, defaultVocabularyItems } from '@/features/aac/defaultVocabulary';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const childId = searchParams.get('childId');

    await connectDB();

    if (childId) {
      // Buscar tablero asociado al niño
      let board = await AACBoardModel.findOne({ childId });

      if (!board) {
        // Si no existía, inicializar uno con el vocabulario base
        const child = await ChildModel.findById(childId);
        board = await AACBoardModel.create({
          childId,
          name: `Tablero de ${child?.nickname || child?.name || 'Comunicación'}`,
          isCustom: false,
          columnsCount: child?.accessibility?.columnsCount || 4,
          categories: defaultCategories,
          items: defaultVocabularyItems,
        });
      }

      return NextResponse.json({ board });
    }

    // Tablero global estándar si no se pasa childId
    return NextResponse.json({
      board: {
        name: 'Tablero Estándar SAAC',
        isCustom: false,
        columnsCount: 4,
        categories: defaultCategories,
        items: defaultVocabularyItems,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener tablero SAAC';
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
    const { childId, newItem, columnsCount } = body;

    if (!childId) {
      return NextResponse.json({ error: 'childId es requerido' }, { status: 400 });
    }

    const auth = await authorizeChildAccess(session.userId, session.role, childId, 'aac.configure');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'No tiene permisos para modificar el comunicador' }, { status: 403 });
    }

    await connectDB();
    let board = await AACBoardModel.findOne({ childId });

    if (!board) {
      board = await AACBoardModel.create({
        childId,
        name: 'Tablero de Comunicación',
        isCustom: true,
        columnsCount: columnsCount || 4,
        categories: defaultCategories,
        items: defaultVocabularyItems,
      });
    }

    if (newItem) {
      board.items.push(newItem);
      board.isCustom = true;
    }

    if (columnsCount) {
      board.columnsCount = columnsCount;
    }

    await board.save();

    return NextResponse.json({ message: 'Tablero actualizado correctamente', board });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar tablero SAAC';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
