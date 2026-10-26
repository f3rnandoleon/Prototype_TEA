import { Permission, UserRole } from '@/types';
import { ChildModel } from '@/models/Child';
import { ChildAccessModel } from '@/models/ChildAccess';
import { connectDB } from '@/lib/db/mongodb';

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  isOwner?: boolean;
}

/**
 * Verifica si un usuario tiene autorización para operar sobre un perfil infantil
 * para un permiso específico.
 * Deniega por defecto cualquier acceso sin vinculación activa o permisos suficientes.
 */
export async function authorizeChildAccess(
  userId: string,
  userRole: UserRole,
  childId: string,
  requiredPermission: Permission
): Promise<AuthorizationResult> {
  if (!userId || !childId) {
    return { authorized: false, reason: 'Identificadores de usuario o niño ausentes' };
  }

  await connectDB();

  // 1. Buscar perfil infantil
  const child = await ChildModel.findById(childId);
  if (!child) {
    return { authorized: false, reason: 'Perfil infantil no encontrado' };
  }

  // 2. Si el usuario es el tutor propietario registrado en el perfil
  if (child.tutorId.toString() === userId) {
    return { authorized: true, isOwner: true };
  }

  // 3. Si no es el tutor propietario, solo puede acceder si tiene un ChildAccess en estado 'accepted'
  const access = await ChildAccessModel.findOne({
    childId,
    userId,
    status: 'accepted',
  });

  if (!access) {
    return {
      authorized: false,
      reason: 'No existe vinculación activa o el acceso ha sido revocado',
    };
  }

  // 4. Si el permiso solicitado está explícitamente en la lista de permisos autorizados
  if (access.permissions && access.permissions.includes(requiredPermission)) {
    return { authorized: true, isOwner: false };
  }

  return {
    authorized: false,
    reason: `Permiso denegado: no dispone de la atribución '${requiredPermission}'`,
  };
}

/**
 * Verifica si el usuario es el tutor propietario exclusivo de un niño (para administración crítica).
 */
export async function authorizeChildOwner(
  userId: string,
  childId: string
): Promise<AuthorizationResult> {
  if (!userId || !childId) {
    return { authorized: false, reason: 'Identificadores inválidos' };
  }

  await connectDB();
  const child = await ChildModel.findById(childId);
  if (!child) {
    return { authorized: false, reason: 'Perfil infantil no encontrado' };
  }

  if (child.tutorId.toString() === userId) {
    return { authorized: true, isOwner: true };
  }

  return { authorized: false, reason: 'Solo el tutor responsable puede administrar este perfil' };
}
