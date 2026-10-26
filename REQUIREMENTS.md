# Levantamiento de Requisitos del Sistema (MVP)

## 1. Requisitos Funcionales (RF)

### M01: Usuarios y Perfiles
- **RF-01**: Autenticación para usuarios adultos (Tutor, Profesional, Docente) con hash de contraseñas bcrypt y tokens JWT HTTP-only.
- **RF-02**: Creación y edición de perfiles infantiles por parte del tutor, con nombre/apodo, avatar, fecha de nacimiento y código de acceso seguro.
- **RF-03**: Perfil individualizado neuroafirmativo: intereses personales, preferencias sensoriales, formas de comunicación, apoyos visuales preferidos, estrategias de autorregulación y situaciones de sobrecarga.
- **RF-04**: Accesibilidad y personalización visual infantil: tamaño de tipografía, tamaño de botones táctiles, contraste, reducción de animaciones, síntesis de voz y número de columnas visuales.
- **RF-05**: Acceso supervisado al entorno infantil, aislado de configuraciones administrativas.

### M02: Vinculaciones y Permisos
- **RF-06**: Generación de invitaciones seguras desde el tutor hacia profesionales o docentes.
- **RF-07**: Aceptación o rechazo de invitaciones por parte de los profesionales y docentes.
- **RF-08**: Configuración granular de categorías de información compartida por perfil infantil.
- **RF-09**: Revocación inmediata del acceso de cualquier usuario vinculado.
- **RF-10**: Auditoría estricta de inicios de sesión, cambios de permisos, revocaciones y exportación de datos.

### M03: Calendario y Rutinas Visuales
- **RF-11**: Calendario y gestor administrativo de rutinas diarias y semanales con repetición programada.
- **RF-12**: Pasos visuales con imágenes, descripciones y tiempos estimados.
- **RF-13**: Agenda visual infantil ("Mi Día"): visualización clara de actividad actual, siguiente, marcado de completado y opción de pedir descanso.
- **RF-14**: Flujo amigable para comunicar cambios imprevistos en la rutina sin alertas estridentes.

### M04: Comunicador SAAC (Aumentativo y Alternativo)
- **RF-15**: Tablero visual de pictogramas con texto en español y categorización visual.
- **RF-16**: Barra de construcción de mensajes con botón de limpieza y reproducción por voz (Web Speech API).
- **RF-17**: Acceso directo y permanente a necesidades urgentes (Sí, No, Quiero, No quiero, Ayuda, Para, Me duele, Necesito descansar).
- **RF-18**: Resiliencia y funcionamiento offline mediante almacenamiento local de tableros y pictogramas esenciales.
- **RF-19**: Privacidad garantizada: no se almacena registro de las frases emitidas.

### M05: Actividades Educativas
- **RF-20**: Creación y asignación de actividades educativas según habilidades trabajadas.
- **RF-21**: Tres tipos de actividades interactivas para el niño:
  - *Tipo A (Asociación)*: Emparejar elementos relacionados.
  - *Tipo B (Selección)*: Elegir la respuesta adecuada entre varias opciones visuales.
  - *Tipo C (Secuencias)*: Ordenar pasos cronológicos de una tarea.
- **RF-22**: Retroalimentación amable, sin castigos ni cronómetros punitivos, registrando los apoyos utilizados.

### M06: Seguimiento y Objetivos
- **RF-23**: Línea de tiempo de observaciones y registros de bienestar (descanso, participación, apoyos).
- **RF-24**: Creación y actualización de objetivos terapéuticos y pedagógicos con criterios observables.
- **RF-25**: Visualización consolidada de progreso y actividades completadas.

### M07: Zona de Calma
- **RF-26**: Pantalla de baja estimulación sensorial con acceso a apoyos relajantes seleccionados por el niño.
- **RF-27**: Sonidos opcionales suaves, botón de silencio inmediato y libertad total para retornar al comunicador o salir.

### M08: Paneles Específicos por Rol
- **RF-28**: Dashboard de Tutor (control total, vinculaciones, configuración infantil).
- **RF-29**: Dashboard Profesional (objetivos terapéuticos, notas de evolución de niños autorizados).
- **RF-30**: Dashboard Docente (actividades pedagógicas, asignaciones, rutinas escolares).
- **RF-31**: Dashboard Infantil simplificado con 4 botones primarios: *Comunicar*, *Mi Día*, *Actividades* y *Necesito una pausa*.

---

## 2. Requisitos No Funcionales (RNF)

- **RNF-01 (Accesibilidad)**: Cumplimiento de pautas WCAG 2.2 nivel AA: contraste adecuado, navegación por teclado, soporte para lectores de pantalla y respeto estricto a `prefers-reduced-motion`.
- **RNF-02 (Seguridad y Privacidad)**: Aislamiento estricto de datos de menores, hashing de contraseñas, sesiones JWT HttpOnly, validación en backend con Zod.
- **RNF-03 (Rendimiento)**: Carga inicial rápida, uso de caché local, componentes optimizados en Next.js.
- **RNF-04 (Diseño Centrado en el Niño)**: Ausencia de estímulos visuales o auditivos abrumadores, tipografía de alta legibilidad, áreas táctiles amplias.
