# Estrategia de Pruebas y Resultados de Validación — Vitest

## 1. Filosofía de Pruebas

La plataforma implementa un enfoque riguroso de pruebas automatizadas centrado en:
1. **Seguridad y Autorización Crítica**: Prevención de IDOR (Insecure Direct Object Reference), denegación por defecto, aislamiento horizontal estricto entre perfiles infantiles de diferentes familias y verificación de revocación inmediata.
2. **Respeto a la Privacidad de los Niños**: Pruebas que verifican que no se persistan historiales de frases privadas del comunicador SAAC.
3. **Resiliencia Offline**: Pruebas de almacenamiento en caché local del comunicador SAAC para operar sin conectividad.
4. **Flujos Integrados de Trabajo**: Verificación del ciclo completo desde la creación del perfil, vinculación, asignación de actividades, ejecución infantil, hasta la revocación de accesos.

---

## 2. Suites de Pruebas Automatizadas

| Archivo de Prueba | Módulo / Funcionalidad | Casos Verificados |
| :--- | :--- | :--- |
| `src/tests/auth-policies.test.ts` | Autenticación, JWT, Hashes, Schemas y Políticas RBAC | 11 pruebas: Hasheo bcrypt, validación de JWT intacto/adulterado, schemas Zod, tutor owner total access, denegación IDOR entre familias, permisos específicos de profesional y revocación inmediata. |
| `src/tests/integration-flow.test.ts` | Integración End-to-End del Ciclo Completo | 1 prueba integral: Tutor crea niño → vincula docente → docente asigna actividad → niño ejecuta actividad → resultado registrado → tutor revoca vinculación → docente pierde acceso inmediatamente. |
| `src/tests/aac-calm.test.ts` | Comunicador SAAC, Vocabulario y Almacenamiento Offline | 3 pruebas: Verificación de las 9 categorías iniciales, presencia de las 8 expresiones de acceso rápido permanente y caché local en localStorage / IndexedDB. |
| `src/tests/routines.test.ts` | Rutinas y Agenda Visual ("Mi Día") | 3 pruebas: Ordenamiento de pasos, cálculo de progreso diario y anticipación cognitiva de paso actual y siguiente. |
| `src/tests/activities.test.ts` | Actividades Educativas Adaptadas | 4 pruebas: Asociación visual (Tipo A), selección entre opciones (Tipo B), secuencias temporales (Tipo C) y trazabilidad de apoyos utilizados. |
| `src/tests/tracking.test.ts` | Seguimiento y Objetivos Individualizados | 2 pruebas: Filtrado estricto de observaciones por visibilidad de rol y registro de notas evolutivas en metas terapéuticas. |

**Total de Pruebas Automatizadas**: 24 pruebas unitarias y de integración pasando al 100%.

---

## 3. Ejecución de Pruebas

Para ejecutar todas las pruebas en consola:
```bash
npm test
```

Salida esperada:
```text
 ✓ src/tests/routines.test.ts (3 tests)
 ✓ src/tests/activities.test.ts (4 tests)
 ✓ src/tests/integration-flow.test.ts (1 test)
 ✓ src/tests/aac-calm.test.ts (3 tests)
 ✓ src/tests/auth-policies.test.ts (11 tests)
 ✓ src/tests/tracking.test.ts (2 tests)

 Test Files  6 passed (6)
      Tests  24 passed (24)
```

Para verificar integridad de tipos TypeScript:
```bash
npx tsc --noEmit
```
*(Debe terminar con código de salida 0 sin ningún error de tipado).*
