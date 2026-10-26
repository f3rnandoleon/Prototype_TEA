import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signJWT, verifyJWT } from '@/lib/auth/jwt';
import { registerSchema, loginSchema } from '@/lib/validations/auth';
import { createChildSchema } from '@/lib/validations/child';
import { inviteUserSchema } from '@/lib/validations/link';
import { authorizeChildAccess } from '@/lib/security/policies';
import { ChildModel } from '@/models/Child';
import { ChildAccessModel } from '@/models/ChildAccess';

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/Child', () => ({
  ChildModel: {
    findById: vi.fn(),
  },
}));

vi.mock('@/models/ChildAccess', () => ({
  ChildAccessModel: {
    findOne: vi.fn(),
  },
}));

describe('Módulo de Autenticación y Criptografía', () => {
  it('debe hashear y verificar contraseñas correctamente', async () => {
    const raw = 'MiClaveSegura123!';
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(await verifyPassword(raw, hash)).toBe(true);
    expect(await verifyPassword('ClaveIncorrecta', hash)).toBe(false);
  });

  it('debe firmar y validar tokens JWT con claims intactos', async () => {
    const payload = {
      userId: 'user_123',
      email: 'tutor@ejemplo.com',
      role: 'tutor' as const,
      name: 'Carlos Tutor',
    };

    const token = await signJWT(payload, '1h');
    expect(typeof token).toBe('string');

    const decoded = await verifyJWT(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(payload.role);
  });

  it('debe rechazar tokens JWT manipulados o inválidos', async () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
    const decoded = await verifyJWT(invalidToken);
    expect(decoded).toBeNull();
  });
});

describe('Validaciones de Entrada (Zod Schemas)', () => {
  it('valida datos de registro válidos e inválidos', () => {
    const valid = registerSchema.safeParse({
      name: 'Ana Docente',
      email: 'ana@colegio.edu',
      password: 'password123',
      role: 'teacher',
    });
    expect(valid.success).toBe(true);

    const invalidEmail = registerSchema.safeParse({
      name: 'Ana Docente',
      email: 'no-es-correo',
      password: 'password123',
      role: 'teacher',
    });
    expect(invalidEmail.success).toBe(false);

    const shortPassword = registerSchema.safeParse({
      name: 'Ana Docente',
      email: 'ana@colegio.edu',
      password: '123',
      role: 'teacher',
    });
    expect(shortPassword.success).toBe(false);
  });

  it('valida creación de perfil infantil con configuraciones neuroafirmativas', () => {
    const validChild = createChildSchema.safeParse({
      name: 'Mateo',
      nickname: 'Mati',
      individualizedProfile: {
        interests: ['Dinosaurios', 'Trenes'],
        sensoryPreferences: ['Luz tenue', 'Audífonos canceladores'],
        communicationModes: ['Pictogramas SAAC', 'Frases cortas'],
        preferredVisualSupports: ['Agenda vertical con iconos'],
        selfRegulationStrategies: ['Espacio de calma', 'Respiración guiada libre'],
        knownDiscomforts: ['Alarmas sonoras fuertes', 'Cambios sin anticipación'],
        notes: 'Le encanta el color azul',
      },
      accessibility: {
        fontSize: 'extra-large',
        buttonSize: 'extra-large',
        contrast: 'normal',
        reducedMotion: true,
        soundEnabled: true,
        voiceTtsEnabled: true,
        voiceSpeed: 0.8,
        columnsCount: 4,
      },
    });
    expect(validChild.success).toBe(true);
  });

  it('valida esquemas de invitación y permisos granulares', () => {
    const validInvite = inviteUserSchema.safeParse({
      childId: 'child_123',
      email: 'fonoaudiologa@clinica.com',
      role: 'professional',
      permissions: ['child.profile.read', 'routine.read', 'aac.use', 'goal.create'],
    });
    expect(validInvite.success).toBe(true);

    const emptyPermissions = inviteUserSchema.safeParse({
      childId: 'child_123',
      email: 'fonoaudiologa@clinica.com',
      role: 'professional',
      permissions: [],
    });
    expect(emptyPermissions.success).toBe(false);
  });
});

describe('Motor de Políticas de Autorización y Prevención IDOR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite acceso total al tutor propietario registrado del niño', async () => {
    const mockChild = {
      _id: 'child_abc',
      tutorId: { toString: () => 'tutor_111' },
    };
    (ChildModel.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockChild);

    const res = await authorizeChildAccess('tutor_111', 'tutor', 'child_abc', 'routine.create');
    expect(res.authorized).toBe(true);
    expect(res.isOwner).toBe(true);
  });

  it('deniega acceso si el tutor intenta acceder al perfil de otra familia (IDOR)', async () => {
    const mockChild = {
      _id: 'child_abc',
      tutorId: { toString: () => 'tutor_111' },
    };
    (ChildModel.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockChild);
    (ChildAccessModel.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    // Tutor 999 intenta acceder al hijo del Tutor 111
    const res = await authorizeChildAccess('tutor_999', 'tutor', 'child_abc', 'child.profile.read');
    expect(res.authorized).toBe(false);
    expect(res.reason).toContain('No existe vinculación activa');
  });

  it('autoriza a un profesional cuando tiene vinculación accepted y el permiso específico concedido', async () => {
    const mockChild = {
      _id: 'child_abc',
      tutorId: { toString: () => 'tutor_111' },
    };
    const mockAccess = {
      childId: 'child_abc',
      userId: 'pro_222',
      status: 'accepted',
      permissions: ['routine.read', 'observation.create'],
    };

    (ChildModel.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockChild);
    (ChildAccessModel.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockAccess);

    const res = await authorizeChildAccess('pro_222', 'professional', 'child_abc', 'routine.read');
    expect(res.authorized).toBe(true);
  });

  it('deniega a un profesional si intenta una acción sin el permiso explícito concedido', async () => {
    const mockChild = {
      _id: 'child_abc',
      tutorId: { toString: () => 'tutor_111' },
    };
    const mockAccess = {
      childId: 'child_abc',
      userId: 'pro_222',
      status: 'accepted',
      permissions: ['routine.read'], // No tiene 'observation.create'
    };

    (ChildModel.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockChild);
    (ChildAccessModel.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockAccess);

    const res = await authorizeChildAccess('pro_222', 'professional', 'child_abc', 'observation.create');
    expect(res.authorized).toBe(false);
    expect(res.reason).toContain('Permiso denegado: no dispone de la atribución');
  });

  it('deniega inmediatamente el acceso si la vinculación fue revocada', async () => {
    const mockChild = {
      _id: 'child_abc',
      tutorId: { toString: () => 'tutor_111' },
    };
    // findOne con status 'accepted' devuelve null porque fue revocada
    (ChildModel.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockChild);
    (ChildAccessModel.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await authorizeChildAccess('docente_333', 'teacher', 'child_abc', 'activity.assign');
    expect(res.authorized).toBe(false);
  });
});
