# Plataforma Integral de Apoyo para Niños Autistas (TEA)

Plataforma digital accesible, segura y neuroafirmativa diseñada para facilitar la comunicación aumentativa y alternativa (SAAC), la estructuración de rutinas visuales, el aprendizaje interactivo individualizado y el bienestar integral de niños autistas, fomentando la colaboración activa entre familias (tutores legales), docentes y profesionales de la salud/educación.

---

## 🌟 Principios Fundamentales del Sistema

1. **Enfoque Centrado en el Niño**: Cada niño posee capacidades, ritmos y necesidades sensoriales únicas. El sistema no asume necesidades a partir de etiquetas diagnósticas.
2. **Respeto a la Neurodiversidad**: No se pretende modificar conductas inofensivas ni forzar conductas normativas. El sistema es una herramienta de apoyo, expresión y autonomía.
3. **Privacidad y Protección por Diseño**: No se almacenan historiales de los mensajes construidos en el SAAC (no es una herramienta de vigilancia). Los accesos a expedientes de menores están estrictamente restringidos y auditados.
4. **Doble Experiencia de Usuario Diferenciada**:
   - **Panel Adulto**: Moderno, profesional, enfocado en gestión, autorizaciones granulares, diseño de rutinas y objetivos.
   - **Modo Infantil**: Táctil, de muy baja carga cognitiva, sin menús administrativos ni riesgos de desconfiguración, con áreas de toque grandes y colores suaves.
5. **Resiliencia Offline**: El comunicador SAAC almacena los tableros y pictogramas localmente (IndexedDB / LocalStorage) para garantizar la comunicación visual básica sin internet.

---

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript (Modo Estricto), Tailwind CSS, Lucide React.
- **Backend**: Next.js Route Handlers con arquitectura modular desacoplada.
- **Persistencia y Base de Datos**: MongoDB con Mongoose (validación de esquemas, índices y tipos estrictos).
- **Autenticación y Seguridad**: Tokens JWT seguros mediante `jose`, contraseñas con hash `bcryptjs`, cookies HttpOnly seguras y motor de autorización por recurso (ABAC/RBAC).
- **Multimedia y Audio**: Síntesis de voz en español (`es-ES`, `es-MX`, `es-US`) mediante Web Speech API nativa del navegador; sintetizador de sonidos relajantes de baja estimulación (lluvia, olas, ruido blanco) mediante Web Audio API 100% offline.
- **Pruebas Automatizadas**: Vitest, Testing Library, TypeScript Type Check.

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js (v18.18+ o v20/v22 recomendada).
- npm (v9+ o v10+).
- Instancia de MongoDB (local en `localhost:27017` o en la nube mediante MongoDB Atlas).

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone <url-del-repositorio>
cd Prototype_TEA
npm install
```

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

Configura tu URI de MongoDB en `.env.local`:
```env
# Ejemplo MongoDB Local:
MONGODB_URI=mongodb://localhost:27017/tea_platform

# Ejemplo MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.mongodb.net/tea_platform?retryWrites=true&w=majority

JWT_SECRET=tu_clave_secreta_jwt_de_al_menos_32_caracteres_12345
```

### 3. Poblar la Base de Datos con Datos de Demostración (Opcional)
Para cargar usuarios, niños (Mateo y Sofía), rutinas, pictogramas SAAC y actividades de demostración:
```bash
npm run seed
```

### 4. Ejecutar la Aplicación en Modo Desarrollo
```bash
npm run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 👥 Cuentas de Demostración Incluidas

| Rol | Correo Electrónico | Contraseña | Descripción |
| :--- | :--- | :--- | :--- |
| **Tutor Legal** | `tutor.demo@tea.org` | `Password123!` | Padre/tutor responsable. Control total de perfiles, permisos y modo niño. |
| **Profesional Clínico** | `terapeuta.demo@tea.org` | `Password123!` | Fonoaudióloga. Objetivos terapéuticos y notas clínicas. |
| **Docente** | `docente.demo@tea.org` | `Password123!` | Educadora Diferencial. Asignación de actividades pedagógicas y rutinas de aula. |

*Nota: También puedes crear cuentas nuevas directamente desde el formulario de registro (`/register`).*

---

## 🗓️ Calendario y Detección de Patrones (`/calendar`)

Módulo neuroafirmativo de visualización mensual y registro diario continuo:
1. **Vista Mensual con Rachas Continuas**: Identificación visual de períodos de estabilidad (menta), semanas de terapia (lavanda pastel) y sensibilidad somática (rosa pastel), además de insignias florales destacadas (`ScallopedFlowerBadge`) para citas clave (terapias, odontología, controles).
2. **Registro Diario & Factores ("Registra síntomas, detecta patrones")**:
   - Selector semanal horizontal (`LUN` a `DOM`) con indicador circular activo.
   - Tarjetas interactivas de factores sensoriales, fisiológicos y de rutina con casillas de verificación animadas (molestia estomacal, sensibilidad auditiva/visual, insomnio, cambios de rutina, búsqueda propioceptiva/stimming).
   - Matriz de estados de ánimo y autorregulación con caritas y micro-insignias de selección.
   - Motor inteligente de detección de correlaciones entre calidad de descanso, apoyos de calma y bienestar basal.

---

## 👶 Modo Niño — Experiencia Infantil

El modo niño cuenta con 4 accesos directos gigantes:
1. 🗣️ **Comunicar** (`/child/[childId]/aac`): Tablero SAAC con pictogramas ARASAAC, categorías, barra de construcción de mensajes, voz en español y acceso permanente a: *Sí, No, Quiero, No quiero, Ayuda, Para, Me duele, Necesito descansar*.
2. 📅 **Mi Día** (`/child/[childId]/schedule`): Agenda visual con anticipación de *Ahora mismo* y *Siguiente actividad*, marcado de pasos y aviso de cambios imprevistos sin estridencias.
3. 🎮 **Actividades** (`/child/[childId]/activities`):
   - **Tipo A**: Asociación visual (emparejamiento).
   - **Tipo B**: Selección entre opciones (tarjetas ilustradas).
   - **Tipo C**: Secuencias temporales (ordenar 1, 2, 3...).
4. 🌿 **Necesito una pausa** (`/child/[childId]/calm`): Zona de calma con paletas suaves (lavanda, salvia, cielo, arena), respiración relajante a su ritmo, sonidos sintetizados opcionales y botón de silencio inmediato.

---

## 🧪 Pruebas Automatizadas

Para ejecutar la suite de pruebas unitarias y de integración de Vitest:
```bash
npm test
```

Para verificar que no existan errores de compilación de TypeScript:
```bash
npx tsc --noEmit
```

---

## 📂 Documentación Adicional

- [ARCHITECTURE.md](file:///e:/proyectos/Prototype_TEA/ARCHITECTURE.md): Arquitectura detallada del sistema y diagrama de capas.
- [DATABASE.md](file:///e:/proyectos/Prototype_TEA/DATABASE.md): Modelos Mongoose, esquemas, índices y relaciones.
- [PERMISSIONS.md](file:///e:/proyectos/Prototype_TEA/PERMISSIONS.md): Matriz RBAC y políticas de control de acceso por recurso infantil.
- [API.md](file:///e:/proyectos/Prototype_TEA/API.md): Documentación completa de endpoints REST.
- [REQUIREMENTS.md](file:///e:/proyectos/Prototype_TEA/REQUIREMENTS.md): Especificación de requisitos funcionales y no funcionales.
- [TESTING.md](file:///e:/proyectos/Prototype_TEA/TESTING.md): Estrategia de testing y resultados.
- [ROADMAP.md](file:///e:/proyectos/Prototype_TEA/ROADMAP.md): Funcionalidades del MVP y visión futura.