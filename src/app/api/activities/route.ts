import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db/mongodb';
import { ActivityModel } from '@/models/Activity';
import { logAuditEvent } from '@/lib/audit/logger';

// Actividades plantilla predeterminadas iniciales para el MVP
const defaultTemplateActivities = [
  {
    title: 'Asociación: Alimentos y Bebidas',
    description: 'Empareja cada comida o bebida con su pictograma correspondiente.',
    skillType: 'Atención y Reconocimiento Visual',
    activityType: 'association',
    difficulty: 'facil',
    instructions: 'Toca un elemento de la izquierda y luego su pareja en la derecha.',
    config: {
      pairs: [
        {
          id: 'p1',
          leftText: 'Manzana',
          leftImage: 'https://api.arasaac.org/api/pictograms/2388?download=false',
          rightText: 'Fruta',
          rightImage: 'https://api.arasaac.org/api/pictograms/2388?download=false',
        },
        {
          id: 'p2',
          leftText: 'Vaso de Leche',
          leftImage: 'https://api.arasaac.org/api/pictograms/2422?download=false',
          rightText: 'Bebida',
          rightImage: 'https://api.arasaac.org/api/pictograms/2422?download=false',
        },
        {
          id: 'p3',
          leftText: 'Pan',
          leftImage: 'https://api.arasaac.org/api/pictograms/2429?download=false',
          rightText: 'Comida',
          rightImage: 'https://api.arasaac.org/api/pictograms/2429?download=false',
        },
      ],
    },
    isTemplate: true,
  },
  {
    title: 'Selección: ¿Qué emoción siento?',
    description: 'Identifica la emoción representada en la situación.',
    skillType: 'Identificación Emocional',
    activityType: 'selection',
    difficulty: 'facil',
    instructions: 'Mira la imagen y elige la opción que describe cómo se siente.',
    config: {
      questions: [
        {
          id: 'q1',
          promptText: 'El niño está sonriendo y jugando en el parque con sus amigos.',
          promptImage: 'https://api.arasaac.org/api/pictograms/2418?download=false',
          options: [
            {
              id: 'o1',
              text: 'Feliz y contento',
              imageUrl: 'https://api.arasaac.org/api/pictograms/2410?download=false',
              isCorrect: true,
            },
            {
              id: 'o2',
              text: 'Triste',
              imageUrl: 'https://api.arasaac.org/api/pictograms/2413?download=false',
              isCorrect: false,
            },
            {
              id: 'o3',
              text: 'Enojado',
              imageUrl: 'https://api.arasaac.org/api/pictograms/2407?download=false',
              isCorrect: false,
            },
          ],
        },
      ],
    },
    isTemplate: true,
  },
  {
    title: 'Secuencia: Lavado de Manos',
    description: 'Ordena los pasos necesarios para lavarse las manos.',
    skillType: 'Secuenciación Temporal y Autonomía',
    activityType: 'sequence',
    difficulty: 'facil',
    instructions: 'Toca los pasos en el orden en que deben realizarse.',
    config: {
      sequence: [
        {
          id: 's1',
          order: 1,
          text: '1. Mojar las manos con agua',
          imageUrl: 'https://api.arasaac.org/api/pictograms/2438?download=false',
        },
        {
          id: 's2',
          order: 2,
          text: '2. Enjabonar y frotar bien',
          imageUrl: 'https://api.arasaac.org/api/pictograms/2449?download=false',
        },
        {
          id: 's3',
          order: 3,
          text: '3. Enjuagar y secar con toalla',
          imageUrl: 'https://api.arasaac.org/api/pictograms/2453?download=false',
        },
      ],
    },
    isTemplate: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    await connectDB();

    // Comprobar si existen plantillas; si no, inicializarlas
    const count = await ActivityModel.countDocuments();
    if (count === 0) {
      for (const tpl of defaultTemplateActivities) {
        await ActivityModel.create({
          ...tpl,
          createdBy: session.userId,
        });
      }
    }

    const activities = await ActivityModel.find().sort({ createdAt: -1 });

    return NextResponse.json({ activities });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al listar actividades';
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
    const { title, description, skillType, activityType, difficulty, instructions, config } = body;

    if (!title || !activityType || !config) {
      return NextResponse.json({ error: 'Datos incompletos para crear actividad' }, { status: 400 });
    }

    await connectDB();
    const newActivity = await ActivityModel.create({
      title,
      description: description || '',
      skillType: skillType || 'Habilidad General',
      activityType,
      difficulty: difficulty || 'facil',
      instructions: instructions || '',
      config,
      createdBy: session.userId,
      isTemplate: false,
    });

    await logAuditEvent({
      userId: session.userId,
      action: 'ACTIVITY_CREATED',
      resource: 'Activity',
      details: { title, activityType },
    });

    return NextResponse.json(
      { message: 'Actividad creada con éxito', activity: newActivity },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear actividad';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
