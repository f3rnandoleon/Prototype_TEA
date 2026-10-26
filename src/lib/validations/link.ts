import { z } from 'zod';

export const validPermissions = [
  'child.profile.read',
  'child.profile.update',
  'child.access.manage',
  'routine.read',
  'routine.create',
  'routine.update',
  'routine.complete',
  'aac.use',
  'aac.configure',
  'activity.create',
  'activity.assign',
  'activity.complete',
  'observation.create',
  'observation.read',
  'goal.create',
  'goal.update',
  'document.read',
  'data.export',
] as const;

export const inviteUserSchema = z.object({
  childId: z.string().min(1, 'El ID del niño es requerido'),
  email: z.string().email('Correo electrónico inválido').toLowerCase().trim(),
  role: z.enum(['professional', 'teacher'], {
    errorMap: () => ({ message: 'Solo se puede invitar como profesional o docente' }),
  }),
  permissions: z.array(z.enum(validPermissions)).min(1, 'Debe asignar al menos un permiso'),
});

export const updateAccessSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'revoked']).optional(),
  permissions: z.array(z.enum(validPermissions)).optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateAccessInput = z.infer<typeof updateAccessSchema>;
