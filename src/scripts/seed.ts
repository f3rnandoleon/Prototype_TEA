import { loadEnvConfig } from '@next/env';
import dns from 'dns';
import mongoose from 'mongoose';
import { hashPassword } from '../lib/auth/password';
import { UserModel } from '../models/User';
import { ChildModel } from '../models/Child';
import { ChildAccessModel } from '../models/ChildAccess';
import { AACBoardModel } from '../models/AACBoard';
import { RoutineModel } from '../models/Routine';
import { RoutineProgressModel } from '../models/RoutineProgress';
import { ActivityModel } from '../models/Activity';
import { ActivityAssignmentModel } from '../models/ActivityAssignment';
import { ActivityResultModel } from '../models/ActivityResult';
import { ObservationModel } from '../models/Observation';
import { GoalModel } from '../models/Goal';
import { ScheduleEventModel } from '../models/ScheduleEvent';
import { PlanChangeModel } from '../models/PlanChange';
import { SomaticLogModel } from '../models/SomaticLog';
import { ABCLogModel } from '../models/ABCLog';
import { BatteryLogModel } from '../models/BatteryLog';
import { defaultCategories, defaultVocabularyItems } from '../features/aac/defaultVocabulary';

// Cargar variables de entorno de .env.local y .env exactamente igual que Next.js
loadEnvConfig(process.cwd());

// Solución para resolución de registros SRV en MongoDB Atlas en Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignorar si no está permitido
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tea_platform';

async function seed() {
  console.log('🌱 [SEED] Conectando a MongoDB en:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ [SEED] Conexión establecida.');

  // Limpiar colecciones anteriores de demostración
  await UserModel.deleteMany({ email: { $regex: /@tea\.org$/ } });
  await ChildModel.deleteMany({});
  await ChildAccessModel.deleteMany({});
  await AACBoardModel.deleteMany({});
  await RoutineModel.deleteMany({});
  await RoutineProgressModel.deleteMany({});
  await ActivityModel.deleteMany({});
  await ActivityAssignmentModel.deleteMany({});
  await ActivityResultModel.deleteMany({});
  await ObservationModel.deleteMany({});
  await GoalModel.deleteMany({});

  console.log('🧹 [SEED] Colecciones limpiadas.');

  // 1. Cuentas de demostración
  const sharedPasswordHash = await hashPassword('Password123!');

  const tutor = await UserModel.create({
    name: 'Carlos González (Tutor)',
    email: 'tutor.demo@tea.org',
    passwordHash: sharedPasswordHash,
    role: 'tutor',
    isActive: true,
  });

  const professional = await UserModel.create({
    name: 'Lic. Valeria Morales',
    email: 'terapeuta.demo@tea.org',
    passwordHash: sharedPasswordHash,
    role: 'professional',
    specialty: 'Fonoaudióloga y Terapeuta de Comunicación',
    isActive: true,
  });

  const teacher = await UserModel.create({
    name: 'Prof. Andrea Castro',
    email: 'docente.demo@tea.org',
    passwordHash: sharedPasswordHash,
    role: 'teacher',
    specialty: 'Educadora Diferencial',
    isActive: true,
  });

  console.log('👤 [SEED] Cuentas de usuario creadas (Tutor, Profesional, Docente).');

  // 2. Perfil infantil 1: Mateo
  const mateo = await ChildModel.create({
    tutorId: tutor._id,
    name: 'Mateo González',
    nickname: 'Mati',
    birthDate: new Date('2019-04-12'),
    individualizedProfile: {
      interests: ['Dinosaurios', 'Trenes eléctricos', 'Pintura digital'],
      sensoryPreferences: ['Luz tenue indirecta', 'Auriculares con cancelación de ruido', 'Tacto suave'],
      communicationModes: ['Pictogramas SAAC', 'Frases cortas de 2-3 palabras', 'Señalamiento visual'],
      preferredVisualSupports: ['Agenda vertical con pasos ilustrados', 'Anticipación con pictogramas'],
      selfRegulationStrategies: ['Espacio de calma en silencio', 'Balanceo rítmico suave', 'Escuchar lluvia suave'],
      knownDiscomforts: ['Cambios de actividad no anunciados', 'Timbres estridentes', 'Espacios muy concurridos'],
      notes: 'Responde de forma sumamente positiva a los refuerzos visuales verdes y prefiere avisos 5 minutos antes.',
    },
    accessibility: {
      fontSize: 'large',
      buttonSize: 'large',
      contrast: 'normal',
      reducedMotion: true,
      soundEnabled: true,
      voiceTtsEnabled: true,
      voiceSpeed: 0.85,
      columnsCount: 4,
    },
  });

  // 3. Perfil infantil 2: Sofía
  const sofia = await ChildModel.create({
    tutorId: tutor._id,
    name: 'Sofía Ramírez',
    nickname: 'Sofi',
    birthDate: new Date('2020-08-20'),
    individualizedProfile: {
      interests: ['Música instrumental', 'Colores pastel', 'Cuentos con texturas'],
      sensoryPreferences: ['Música suave de piano', 'Mantas con peso'],
      communicationModes: ['SAAC táctil', 'Gestos naturales'],
      preferredVisualSupports: ['Tiras horizontales de secuencias'],
      selfRegulationStrategies: ['Respiración pausada', 'Rincón de descanso visual'],
      knownDiscomforts: ['Luces fluorescentes parpadeantes', 'Tonos de voz elevados'],
      notes: 'Le agrada tener siempre a la vista el botón de regreso a la zona de calma.',
    },
    accessibility: {
      fontSize: 'extra-large',
      buttonSize: 'extra-large',
      contrast: 'soft',
      reducedMotion: true,
      soundEnabled: true,
      voiceTtsEnabled: true,
      voiceSpeed: 0.9,
      columnsCount: 3,
    },
  });

  console.log('🧒 [SEED] Perfiles infantiles creados (Mateo y Sofía).');

  // 4. Tableros SAAC iniciales
  await AACBoardModel.create({
    childId: mateo._id,
    name: 'Tablero de Mati',
    isCustom: false,
    columnsCount: 4,
    categories: defaultCategories,
    items: defaultVocabularyItems,
  });

  await AACBoardModel.create({
    childId: sofia._id,
    name: 'Tablero de Sofi',
    isCustom: false,
    columnsCount: 3,
    categories: defaultCategories,
    items: defaultVocabularyItems,
  });

  // 5. Vinculaciones con permisos granulares explícitos
  await ChildAccessModel.create({
    childId: mateo._id,
    userId: professional._id,
    invitedBy: tutor._id,
    role: 'professional',
    status: 'accepted',
    permissions: [
      'child.profile.read',
      'routine.read',
      'aac.use',
      'observation.create',
      'observation.read',
      'goal.create',
      'goal.update',
      'activity.assign',
    ],
  });

  await ChildAccessModel.create({
    childId: mateo._id,
    userId: teacher._id,
    invitedBy: tutor._id,
    role: 'teacher',
    status: 'accepted',
    permissions: [
      'child.profile.read',
      'routine.read',
      'activity.create',
      'activity.assign',
      'observation.create',
      'observation.read',
    ],
  });

  console.log('🔗 [SEED] Vinculaciones de equipo multidisciplinario creadas.');

  // 6. Rutinas con pasos ilustrados
  const morningRoutine = await RoutineModel.create({
    childId: mateo._id,
    title: 'Rutina de la Mañana',
    description: 'Secuencia estructurada para comenzar el día con calma.',
    category: 'manana',
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '07:30',
    isActive: true,
    steps: [
      {
        id: 'step-despertar',
        order: 1,
        title: 'Despertar y estirarse',
        description: 'Abrir los ojos despacio con la luz suave',
        iconUrl: 'https://api.arasaac.org/api/pictograms/2453?download=false',
        estimatedMinutes: 5,
      },
      {
        id: 'step-bano',
        order: 2,
        title: 'Ir al baño y lavar cara',
        description: 'Usar agua tibia y secar con toalla suave',
        iconUrl: 'https://api.arasaac.org/api/pictograms/2449?download=false',
        estimatedMinutes: 10,
      },
      {
        id: 'step-vestirse',
        order: 3,
        title: 'Ponerse ropa cómoda',
        description: 'Camiseta de algodón y pantalones favoritos',
        iconUrl: 'https://api.arasaac.org/api/pictograms/2418?download=false',
        estimatedMinutes: 10,
      },
      {
        id: 'step-desayuno',
        order: 4,
        title: 'Tomar desayuno',
        description: 'Leche tibia y tostadas con fruta',
        iconUrl: 'https://api.arasaac.org/api/pictograms/2422?download=false',
        estimatedMinutes: 20,
      },
      {
        id: 'step-mochila',
        order: 5,
        title: 'Revisar mochila escolar',
        description: 'Guardar cuaderno y botella de agua',
        iconUrl: 'https://api.arasaac.org/api/pictograms/2406?download=false',
        estimatedMinutes: 5,
      },
    ],
  });

  // Progreso de rutina para hoy
  await RoutineProgressModel.create({
    childId: mateo._id,
    routineId: morningRoutine._id,
    date: new Date().toISOString().split('T')[0],
    completedStepIds: ['step-despertar', 'step-bano'],
    status: 'in_progress',
  });

  // 7. Actividades Adaptadas
  const act1 = await ActivityModel.create({
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
          rightText: 'Fruta dulce',
          rightImage: 'https://api.arasaac.org/api/pictograms/2388?download=false',
        },
        {
          id: 'p2',
          leftText: 'Vaso de Leche',
          leftImage: 'https://api.arasaac.org/api/pictograms/2422?download=false',
          rightText: 'Bebida fresca',
          rightImage: 'https://api.arasaac.org/api/pictograms/2422?download=false',
        },
        {
          id: 'p3',
          leftText: 'Pan',
          leftImage: 'https://api.arasaac.org/api/pictograms/2429?download=false',
          rightText: 'Para el desayuno',
          rightImage: 'https://api.arasaac.org/api/pictograms/2429?download=false',
        },
      ],
    },
    createdBy: teacher._id,
    isTemplate: true,
  });

  const act2 = await ActivityModel.create({
    title: 'Selección: Reconocer Emociones',
    description: 'Identifica la emoción que siente el personaje.',
    skillType: 'Identificación Emocional',
    activityType: 'selection',
    difficulty: 'facil',
    instructions: 'Observa la imagen y elige la tarjeta que describe cómo se siente.',
    config: {
      questions: [
        {
          id: 'q1',
          promptText: 'El niño está sonriendo mientras dibuja su tren favorito.',
          promptImage: 'https://api.arasaac.org/api/pictograms/2418?download=false',
          options: [
            {
              id: 'o1',
              text: 'Feliz y relajado',
              imageUrl: 'https://api.arasaac.org/api/pictograms/2410?download=false',
              isCorrect: true,
            },
            {
              id: 'o2',
              text: 'Cansado',
              imageUrl: 'https://api.arasaac.org/api/pictograms/2407?download=false',
              isCorrect: false,
            },
          ],
        },
      ],
    },
    createdBy: professional._id,
    isTemplate: true,
  });

  const act3 = await ActivityModel.create({
    title: 'Secuencia: Lavado de Manos Paso a Paso',
    description: 'Ordena las acciones para lavarse las manos.',
    skillType: 'Secuenciación Temporal y Autonomía',
    activityType: 'sequence',
    difficulty: 'facil',
    instructions: 'Toca las tarjetas en el orden correcto.',
    config: {
      sequence: [
        {
          id: 's1',
          order: 1,
          text: '1. Abrir la llave y mojar manos',
          imageUrl: 'https://api.arasaac.org/api/pictograms/2438?download=false',
        },
        {
          id: 's2',
          order: 2,
          text: '2. Frotar con jabón suave',
          imageUrl: 'https://api.arasaac.org/api/pictograms/2449?download=false',
        },
        {
          id: 's3',
          order: 3,
          text: '3. Secar bien con toalla limpia',
          imageUrl: 'https://api.arasaac.org/api/pictograms/2453?download=false',
        },
      ],
    },
    createdBy: teacher._id,
    isTemplate: true,
  });

  // 8. Asignar actividades a Mateo
  const asg1 = await ActivityAssignmentModel.create({
    childId: mateo._id,
    activityId: act1._id,
    assignedBy: teacher._id,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'completed',
  });

  await ActivityAssignmentModel.create({
    childId: mateo._id,
    activityId: act2._id,
    assignedBy: professional._id,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'pending',
  });

  // Resultado de la actividad completada
  await ActivityResultModel.create({
    assignmentId: asg1._id,
    childId: mateo._id,
    activityId: act1._id,
    score: 3,
    totalItems: 3,
    supportsUsed: ['lectura en voz alta'],
    timeSpentSeconds: 42,
    feedbackNotes: 'Completó los tres emparejamientos con mucha motivación.',
  });

  // 9. Observaciones descriptivas
  await ObservationModel.create({
    childId: mateo._id,
    authorId: professional._id,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    category: 'sensorial',
    description: 'Durante la sesión fonoaudiológica, al notar ruido externo de obras, utilizó espontáneamente sus auriculares protectores y continuó la actividad con agrado.',
    supportsUsed: ['Auriculares canceladores de ruido', 'Pictograma de pausa'],
    observedOutcome: 'Autorregulación autónoma exitosa sin desborde sensorial.',
    visibility: ['tutor', 'professional', 'teacher'],
  });

  await ObservationModel.create({
    childId: mateo._id,
    authorId: teacher._id,
    date: new Date(Date.now() - 48 * 60 * 60 * 1000),
    category: 'pedagogico',
    description: 'En el aula realizó con éxito la secuencia de lavado de manos guiado por el panel visual.',
    supportsUsed: ['Panel visual vertical'],
    observedOutcome: 'Mayor independencia en la rutina de aseo.',
    visibility: ['tutor', 'teacher'],
  });

  // 10. Objetivos Individualizados
  await GoalModel.create({
    childId: mateo._id,
    description: 'Solicitar pausa o descanso mediante el botón permanente del comunicador SAAC antes de alcanzar sobrecarga sensorial.',
    area: 'comunicacion',
    responsibleId: professional._id,
    startDate: new Date('2026-03-01'),
    criteria: 'Utiliza el acceso rápido de pausa en al menos 3 ocasiones semanales sin requerir instigación verbal directa.',
    status: 'en_progreso',
    progressNotes: [
      {
        date: new Date('2026-03-15'),
        note: 'Mateo reconoció el botón de descanso y lo presionó con éxito tras 20 minutos de juego estructurado.',
        authorId: professional._id,
      },
    ],
  });

  // 11. Eventos no rutinarios y anticipación visual
  await ScheduleEventModel.deleteMany({});
  await ScheduleEventModel.create({
    childId: mateo._id,
    title: 'Visita de control al Odontólogo Pediátrico',
    description: 'Revisión dental preventiva con la Dra. Méndez en clínica adaptada.',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '10:30',
    iconEmoji: '🏥',
    isNonRoutine: true,
    alertLevel: 'importante',
    visualPrepNotes: 'Llevar audífonos canceladores de ruido y juguete sensorial favorito',
    createdBy: tutor._id,
    creatorRole: 'tutor',
  });

  // 12. Cambio de planes activo
  await PlanChangeModel.deleteMany({});
  await PlanChangeModel.create({
    childId: mateo._id,
    originalActivity: 'Ir al parque a correr',
    newTask: 'Pintura y armar bloques en casa',
    nextTask: 'Almorzar juntos en familia',
    childOptions: ['Pintar con témperas verdes', 'Armar dinosaurios de madera', 'Escuchar música de lluvia'],
    reasonNotes: 'Lluvia intensa y viento frío en el exterior',
    isActive: true,
    announcedAt: new Date(),
    createdBy: tutor._id,
  });

  // 13. Bitácora somática y fisiológica
  await SomaticLogModel.deleteMany({});
  await SomaticLogModel.create({
    childId: mateo._id,
    authorId: tutor._id,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    sleepHours: 8.5,
    sleepQuality: 'bueno',
    appetite: 'normal',
    physicalDiscomfort: 'ninguno',
    wellbeingNote: 'Despertó con buen ánimo y dispuesto a comenzar la jornada.',
  });

  await SomaticLogModel.create({
    childId: mateo._id,
    authorId: tutor._id,
    date: new Date(Date.now() - 48 * 60 * 60 * 1000),
    sleepHours: 7.0,
    sleepQuality: 'inquieto',
    appetite: 'bajo',
    physicalDiscomfort: 'leve',
    discomfortNotes: 'Molestia leve en encías por recambio dental.',
    wellbeingNote: 'Necesitó mayor contención matutina y alimentos suaves.',
  });

  // 14. Registro ABC neuroafirmativo
  await ABCLogModel.deleteMany({});
  await ABCLogModel.create({
    childId: mateo._id,
    authorId: professional._id,
    date: new Date(Date.now() - 36 * 60 * 60 * 1000),
    antecedentContext: 'Transición inesperada hacia el aula de música con ruidos de percusión altos',
    observedBehavior: 'Se cubrió ambos oídos con las manos, buscó agacharse cerca de la pared y vocalizó malestar',
    unmetNeed: 'Sobrecarga acústica súbita y falta de anticipación visual previa sobre el instrumento ruidoso',
    supportProvided: 'Se le facilitaron audífonos canceladores, se redujo el volumen ambiental y se utilizó el pictograma de calma',
    outcome: 'Respiró profundamente, logró reincorporarse al grupo y acompañó el ritmo con palmadas suaves',
    visibility: ['tutor', 'professional', 'teacher'],
  });

  // 15. Batería sensorial subjetiva
  await BatteryLogModel.deleteMany({});
  await BatteryLogModel.create({
    childId: mateo._id,
    level: 'comodo',
    note: 'Me siento bien y con energía para seguir',
    registeredBy: 'child',
    authorName: 'Mati (Autorregistro)',
  });

  console.log('🎯 [SEED] Planificación y Seguimiento enriquecidos.');
  console.log('✨ [SEED] Base de datos poblada exitosamente.');
  await mongoose.disconnect();
}


seed().catch((err) => {
  console.error('❌ [SEED_ERROR]:', err);
  process.exit(1);
});
