# Documentación de la API REST — Route Handlers

Todos los endpoints que gestionan recursos sensibles verifican autenticación (mediante cookie `tea_session` o token `Authorization: Bearer <jwt>`) y aplican el motor de políticas de autorización por recurso (`authorizeChildAccess`).

---

## 1. Autenticación y Cuentas (`/api/auth`)

### `POST /api/auth/register`
Registra un nuevo usuario adulto (Tutor, Profesional o Docente).
- **Body**:
  ```json
  {
    "name": "Carlos González",
    "email": "carlos@correo.com",
    "password": "Password123!",
    "role": "tutor",
    "specialty": "Opcional si es profesional"
  }
  ```
- **Respuesta (201 Created)**: Retorna datos del usuario y establece cookie HttpOnly `tea_session`.

### `POST /api/auth/login`
Inicia sesión con credenciales.
- **Body**:
  ```json
  {
    "email": "carlos@correo.com",
    "password": "Password123!"
  }
  ```
- **Respuesta (200 OK)**: Retorna datos del usuario y emite cookie HttpOnly.

### `POST /api/auth/logout`
Cierra la sesión activa invalidando la cookie.

### `GET /api/auth/me`
Obtiene los datos del usuario autenticado en la sesión actual.

---

## 2. Perfiles Infantiles (`/api/children`)

### `GET /api/children`
- Si el usuario es **Tutor**: Retorna los niños creados por él.
- Si el usuario es **Profesional** o **Docente**: Retorna únicamente los niños a los que tiene vinculación aceptada.

### `POST /api/children`
Crea un nuevo perfil infantil (Solo rol `tutor`). Crea automáticamente un tablero SAAC con el vocabulario esencial para el menor.
- **Body**:
  ```json
  {
    "name": "Mateo",
    "nickname": "Mati",
    "birthDate": "2019-04-12",
    "individualizedProfile": {
      "interests": ["Dinosaurios", "Trenes"],
      "sensoryPreferences": ["Luz tenue"],
      "communicationModes": ["Pictogramas SAAC"],
      "preferredVisualSupports": ["Agenda vertical"],
      "selfRegulationStrategies": ["Espacio de calma"],
      "knownDiscomforts": ["Ruidos fuertes"],
      "notes": "Notas adicionales"
    },
    "accessibility": {
      "fontSize": "large",
      "buttonSize": "large",
      "contrast": "normal",
      "reducedMotion": true,
      "soundEnabled": true,
      "voiceTtsEnabled": true,
      "voiceSpeed": 0.9,
      "columnsCount": 4
    }
  }
  ```

### `GET /api/children/:childId`
Consulta el perfil del niño. Requiere permiso `child.profile.read` o tutor propietario.

### `PUT /api/children/:childId`
Actualiza el perfil o configuración de accesibilidad. Requiere permiso `child.profile.update` o tutor propietario.

### `DELETE /api/children/:childId`
Elimina el perfil infantil y cascada de vinculaciones/tableros. Exclusivo del tutor propietario.

---

## 3. Vinculaciones y Permisos (`/api/links`)

### `GET /api/links`
Lista las vinculaciones activas y pendientes.
- Tutores ven vinculaciones asociadas a sus hijos.
- Docentes/Profesionales ven invitaciones dirigidas a ellos.

### `POST /api/links`
El tutor invita a un profesional o docente por correo electrónico asignando permisos específicos.
- **Body**:
  ```json
  {
    "childId": "65123456789...",
    "email": "terapeuta@correo.com",
    "role": "professional",
    "permissions": ["child.profile.read", "routine.read", "observation.create", "goal.create"]
  }
  ```

### `PUT /api/links/:linkId`
- Si es el **destinatario**: puede aceptar (`status: "accepted"`) o rechazar (`status: "rejected"`).
- Si es el **tutor propietario**: puede actualizar permisos (`permissions: [...]`) o revocar.

### `DELETE /api/links/:linkId`
Revoca inmediatamente la vinculación (`status: "revoked"`). Invalida de forma instantánea cualquier consulta o mutación posterior.

---

## 4. Comunicador SAAC (`/api/aac/boards`)

### `GET /api/aac/boards?childId=:childId`
Obtiene el tablero SAAC del niño con categorías y pictogramas (o plantilla predeterminada).

### `POST /api/aac/boards`
Agrega un pictograma personalizado o actualiza las columnas visuales del tablero. Requiere permiso `aac.configure`.

---

## 5. Calendario y Rutinas (`/api/routines`)

### `GET /api/routines?childId=:childId`
Obtiene las rutinas programadas para el niño. Requiere permiso `routine.read`.

### `POST /api/routines`
Crea una nueva rutina con pasos ilustrados. Requiere permiso `routine.create`.
- **Body**:
  ```json
  {
    "childId": "...",
    "title": "Rutina de la Mañana",
    "category": "manana",
    "daysOfWeek": [1, 2, 3, 4, 5],
    "startTime": "07:30",
    "steps": [
      {
        "id": "step-1",
        "order": 1,
        "title": "Despertar y vestirse",
        "iconUrl": "https://api.arasaac.org/api/pictograms/2453",
        "estimatedMinutes": 10
      }
    ]
  }
  ```

### `POST /api/routines/:routineId/progress`
Registra el progreso diario de un paso (completado o desmarcado).
- **Body**: `{ "stepId": "step-1", "isCompleted": true }`

---

## 6. Actividades Educativas (`/api/activities`)

### `GET /api/activities`
Retorna la biblioteca de actividades adaptadas (Asociación, Selección, Secuencias).

### `POST /api/activities`
Crea una actividad interactiva personalizada.

### `POST /api/activities/assign`
Asigna una actividad a un niño con fecha de entrega opcional. Requiere `activity.assign`.

### `POST /api/activities/:activityId/submit`
Registra el resultado de la participación del niño:
- **Body**:
  ```json
  {
    "childId": "...",
    "assignmentId": "...",
    "score": 3,
    "totalItems": 3,
    "supportsUsed": ["pista visual", "lectura en voz alta"],
    "timeSpentSeconds": 45
  }
  ```

---

## 7. Seguimiento y Objetivos (`/api/observations` & `/api/goals`)

### `GET /api/observations?childId=:childId`
Lista observaciones filtradas por la visibilidad del rol autenticado.

### `POST /api/observations`
Registra una observación o nota de bienestar (categorías: `bienestar`, `sensorial`, `descanso`, `pedagógico`, etc.).

### `GET /api/goals?childId=:childId`
Lista los objetivos de apoyo individualizados.

### `POST /api/goals`
Crea un objetivo con criterio observable y área asignada.

### `PUT /api/goals/:goalId`
Actualiza el estado del objetivo o añade notas de avance colaborativas.

---

## 8. Auditoría (`/api/audit`)

### `GET /api/audit?childId=:childId`
Consulta el registro inmutable de auditoría (inicios de sesión, cambios de permisos, revocaciones, creación de perfiles). Exclusivo del tutor legal.
