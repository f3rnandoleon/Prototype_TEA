# Hoja de Ruta (Roadmap) — MVP y Futuras Fases

## 1. Estado Actual — MVP Funcional Completado

### M01: Usuarios y Perfiles
-  Registro e inicio de sesión seguro con JWT (cookies HttpOnly) y hash bcrypt.
-  Roles diferenciados: Tutor Legal, Profesional Clínico (con especialidad configurable) y Docente.
-  Perfiles infantiles completos con datos neuroafirmativos: intereses personales, preferencias sensoriales, modos de comunicación, apoyos preferidos, autorregulación y situaciones de malestar.
-  Configuración de accesibilidad visual por niño (tamaño de fuente, botones táctiles, contraste, reducción de movimiento, velocidad de voz y número de columnas SAAC).
-  Modo infantil aislado y protegido sin menús administrativos.

### M02: Vinculaciones y Permisos
-  Invitaciones dirigidas por correo con selección granular de permisos.
-  Aceptación y rechazo por parte de profesionales y docentes.
-  Revocación inmediata del acceso por parte del tutor (invalidación instantánea en servidor).
-  Auditoría inmutable de eventos sensibles y accesos.

### M03: Calendario y Rutinas Visuales
-  Gestor administrativo de rutinas con horarios, días de repetición y pasos ilustrados.
-  Agenda visual infantil ("Mi Día") con actividad actual destacada y actividad siguiente (reducción de ansiedad cognitiva).
-  Marcado interactivo de pasos completados y cálculo diario de progreso.
-  Flujo estructurado y amable para anticipar cambios imprevistos en el plan sin alarmas sonoras intensas.

### M04: Comunicador SAAC (Aumentativo y Alternativo)
-  Tablero visual con 9 categorías temáticas esenciales y pictogramas ARASAAC.
-  Tira de construcción de mensajes con botón de limpieza, borrado del último elemento y síntesis de voz en español (Web Speech API).
-  Acceso permanente y directo a expresiones críticas: *Sí, No, Quiero, No quiero, Ayuda, Para, Me duele, Necesito descansar*.
-  Soporte offline mediante almacenamiento local (LocalStorage / IndexedDB).
-  Creación de pictogramas personalizados.
-  Garantía de privacidad: no almacenamiento de historiales de mensajes emitidos.

### M05: Actividades Educativas Adaptadas
-  Biblioteca de actividades y asignación controlada a niños autorizados.
-  Tres motores interactivos:
  - **Tipo A**: Asociación visual (emparejamiento).
  - **Tipo B**: Selección entre opciones (tarjetas ilustradas).
  - **Tipo C**: Secuencias temporales cronológicas.
-  Retroalimentación amable sin cronómetros punitivos y registro de apoyos utilizados.

### M06: Seguimiento y Objetivos
-  Línea de tiempo de observaciones colaborativas (bienestar, sensorial, descanso, pedagógico).
-  Filtrado estricto de notas por visibilidad de rol.
-  Objetivos individualizados con criterios observables y notas de evolución continua.

### M07: Zona de Calma
-  Pantalla de baja estimulación sensorial con 4 paletas suaves (lavanda, salvia, cielo, arena).
-  Visual de respiración pausada y respetuosa a su ritmo.
-  Sonidos sintetizados localmente mediante Web Audio API (Lluvia suave, Olas del mar, Ruido blanco) con 100% de operatividad offline.
-  Botón de silenciamiento inmediato.
-  Acceso directo para pedir ayuda, volver al comunicador o salir con libertad.

### M08: Paneles Específicos por Rol
-  Dashboard de Tutor Legal (administración total, perfiles, vinculaciones, auditoría).
-  Dashboard Profesional (niños autorizados, notas clínicas, objetivos).
-  Dashboard Docente (estudiantes vinculados, asignación de actividades, notas pedagógicas).
-  Dashboard Infantil (4 botones primarios gigantes).

---

## 2. Funcionalidades Futuras (Post-MVP)

- [ ] **Almacenamiento S3 / Azure Blob Storage**: Para imágenes y audios personalizados aportados por la familia en la nube con URLs firmadas temporales.
- [ ] **Exportación formal de informes en PDF**: Para presentar en reuniones escolares o clínicas con consentimiento explícito del tutor.
- [ ] **Integración ampliada con API oficial de ARASAAC**: Búsqueda en vivo de pictogramas adicionales en el catálogo oficial multilingüe.
- [ ] **Soporte PWA (Progressive Web App)**: Instalación como aplicación nativa en tablets y teléfonos inteligentes con Service Workers para precarga total de activos.
- [ ] **Modo de control por pulsadores (Switch Access)**: Escaneo visual asistido para niños con desafíos motores significativos.
- [ ] **Notificaciones Web Push**: Recordatorios respetuosos de rutinas y avisos de nuevas actividades asignadas.
