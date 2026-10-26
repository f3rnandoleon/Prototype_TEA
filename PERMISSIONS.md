# Matriz de Autorización y Permisos — Control de Acceso por Recurso

## 1. Filosofía de Seguridad y Reglas Inviolables

1. **Denegación por Defecto (Default Deny)**: Si un usuario no posee un registro explícito en `ChildAccess` en estado `accepted`, o no es el `tutorId` propietario del perfil infantil, cualquier acceso a la información del niño es denegado inmediatamente con HTTP 403.
2. **Autorización en Servidor**: El frontend oculta botones según permisos, pero cada Route Handler en el backend evalúa rigurosamente la sesión y la política de autorización antes de interactuar con la base de datos.
3. **Aislamiento Horizontal**: Un tutor o docente no puede bajo ninguna circunstancia leer ni modificar información de un niño ajeno. La simple modificación del `childId` en una solicitud URL o JSON resultará en denegación.
4. **Revocación Inmediata**: En el instante en que un tutor revoca el acceso a un docente o profesional (`status = 'revoked'`), se anulan inmediatamente todas las consultas o mutaciones futuras de dicho usuario sobre el perfil del menor.
5. **Privacidad Infantil Incondicional**: Las comunicaciones generadas en el SAAC no son espiadas ni almacenadas en historiales continuos.

---

## 2. Matriz de Permisos por Rol

| Permiso | Tutor (Propietario) | Profesional (Vinculado) | Docente (Vinculado) | Niño (Modo Infantil) |
| :--- | :---: | :---: | :---: | :---: |
| `child.profile.read` |  Sí (Completo) |  Sí (Autorizado) |  Sí (Educativo) |  Sí (Básico propio) |
| `child.profile.update` |  Sí | ❌ No | ❌ No | ❌ No |
| `child.access.manage` |  Sí (Conceder/Revocar) | ❌ No | ❌ No | ❌ No |
| `routine.read` |  Sí |  Sí (Si concedido) |  Sí (Si concedido) |  Sí (Visual Mi Día) |
| `routine.create` |  Sí | ⚠️ Propuesta | ⚠️ Propuesta | ❌ No |
| `routine.update` |  Sí | ❌ No (Requiere tutor) | ❌ No | ❌ No |
| `routine.complete` |  Sí |  Sí |  Sí |  Sí (Marcar paso) |
| `aac.use` |  Sí |  Sí |  Sí |  Sí (Comunicador) |
| `aac.configure` |  Sí | ⚠️ Si concedido | ❌ No | ❌ No |
| `activity.create` |  Sí |  Sí |  Sí | ❌ No |
| `activity.assign` |  Sí |  Sí (A vinculados) |  Sí (A vinculados) | ❌ No |
| `activity.complete` |  Sí (Asistir) |  Sí (Asistir) |  Sí (Asistir) |  Sí (Ejecutar) |
| `observation.create` |  Sí |  Sí (Clínica/Terapéutica) |  Sí (Pedagógica) | ❌ No |
| `observation.read` |  Sí (Todas) |  Sí (Autorizadas) |  Sí (Pedagógicas) | ❌ No |
| `goal.create` |  Sí |  Sí (Terapéuticos) |  Sí (Pedagógicos) | ❌ No |
| `goal.update` |  Sí |  Sí (Sus metas) |  Sí (Sus metas) | ❌ No |
| `document.read` |  Sí |  Sí (Si concedido) | ❌ No (Salvo educ.) | ❌ No |
| `data.export` |  Sí | ❌ No | ❌ No | ❌ No |

---

## 3. Implementación de Políticas en Código

Cada endpoint ejecuta la siguiente verificación canónica:

```typescript
// src/lib/security/policies.ts
export async function authorizeChildAccess(
  userId: string,
  userRole: UserRole,
  childId: string,
  requiredPermission: Permission
): Promise<{ authorized: boolean; reason?: string }> {
  // 1. Si es el tutor creador, tiene acceso total
  const child = await ChildModel.findById(childId);
  if (!child) return { authorized: false, reason: 'Niño no encontrado' };
  
  if (child.tutorId.toString() === userId) {
    return { authorized: true };
  }

  // 2. Si es profesional o docente, verificar ChildAccess activo
  const access = await ChildAccessModel.findOne({
    childId,
    userId,
    status: 'accepted'
  });

  if (!access) {
    return { authorized: false, reason: 'No existe vinculación activa autorizada' };
  }

  // 3. Verificar que el permiso requerido esté en la lista otorgada por el tutor
  if (!access.permissions.includes(requiredPermission)) {
    return { authorized: false, reason: `Permiso insuficiente: ${requiredPermission}` };
  }

  return { authorized: true };
}
```
