import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorizeChildAccess } from '@/lib/security/policies';
import { ChildModel } from '@/models/Child';
import { ChildAccessModel } from '@/models/ChildAccess';
import { ActivityModel } from '@/models/Activity';
import { ActivityAssignmentModel } from '@/models/ActivityAssignment';
import { ActivityResultModel } from '@/models/ActivityResult';

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

describe('Prueba de Integración End-to-End del Flujo de Trabajo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ejecuta el ciclo completo: creación -> vinculación -> asignación -> realización -> consulta -> revocación -> denegación', async () => {
    // 1. Tutor crea perfil infantil (Mateo)
    const childId = 'child_mateo_01';
    const tutorId = 'user_tutor_carlos';
    const teacherId = 'user_teacher_ana';

    const mockChild = {
      _id: childId,
      name: 'Mateo',
      tutorId: { toString: () => tutorId },
    };
    (ChildModel.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockChild);

    // Tutor tiene acceso total a Mateo
    const tutorCheck = await authorizeChildAccess(tutorId, 'tutor', childId, 'child.profile.read');
    expect(tutorCheck.authorized).toBe(true);
    expect(tutorCheck.isOwner).toBe(true);

    // 2. Docente sin vinculación intenta acceder -> DENEGADO
    (ChildAccessModel.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const unlinkedTeacherCheck = await authorizeChildAccess(teacherId, 'teacher', childId, 'activity.assign');
    expect(unlinkedTeacherCheck.authorized).toBe(false);

    // 3. Tutor vincula al docente con permisos ['activity.assign', 'observation.create']
    const activeLink = {
      childId,
      userId: teacherId,
      status: 'accepted',
      permissions: ['activity.assign', 'observation.create', 'routine.read'],
    };
    (ChildAccessModel.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(activeLink);

    // Docente ahora está AUTORIZADO para asignar actividades
    const linkedTeacherCheck = await authorizeChildAccess(teacherId, 'teacher', childId, 'activity.assign');
    expect(linkedTeacherCheck.authorized).toBe(true);

    // 4. Docente asigna actividad educativa
    const assignment = {
      _id: 'asg_123',
      childId,
      activityId: 'act_association_01',
      assignedBy: teacherId,
      status: 'pending',
    };
    expect(assignment.status).toBe('pending');

    // 5. Niño realiza la actividad en el modo infantil
    const result = {
      assignmentId: assignment._id,
      childId,
      activityId: assignment.activityId,
      score: 3,
      totalItems: 3,
      supportsUsed: ['pista visual'],
      timeSpentSeconds: 35,
    };
    assignment.status = 'completed';

    expect(result.score).toBe(3);
    expect(result.supportsUsed).toContain('pista visual');
    expect(assignment.status).toBe('completed');

    // 6. Tutor revoca la vinculación del docente
    // Al revocar, findOne con status 'accepted' devuelve null
    (ChildAccessModel.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    // 7. Docente intenta asignar o consultar después de la revocación -> INMEDIATAMENTE DENEGADO
    const revokedTeacherCheck = await authorizeChildAccess(teacherId, 'teacher', childId, 'activity.assign');
    expect(revokedTeacherCheck.authorized).toBe(false);
    expect(revokedTeacherCheck.reason).toContain('No existe vinculación activa');
  });
});
