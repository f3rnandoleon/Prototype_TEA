// Roles de usuario del sistema
export type UserRole = 'tutor' | 'professional' | 'teacher';

// Permisos del sistema RBAC y control por recurso
export type Permission =
  | 'child.profile.read'
  | 'child.profile.update'
  | 'child.access.manage'
  | 'routine.read'
  | 'routine.create'
  | 'routine.update'
  | 'routine.complete'
  | 'aac.use'
  | 'aac.configure'
  | 'activity.create'
  | 'activity.assign'
  | 'activity.complete'
  | 'observation.create'
  | 'observation.read'
  | 'goal.create'
  | 'goal.update'
  | 'document.read'
  | 'data.export';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  specialty?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Configuración de accesibilidad y personalización visual
export interface IChildAccessibility {
  fontSize: 'normal' | 'large' | 'extra-large';
  buttonSize: 'normal' | 'large' | 'extra-large';
  contrast: 'normal' | 'high' | 'soft';
  reducedMotion: boolean;
  soundEnabled: boolean;
  voiceTtsEnabled: boolean;
  voiceSpeed: number; // 0.5 a 1.5
  columnsCount: number; // 2, 3, 4, 6
}

// Perfil individualizado neuroafirmativo
export interface IIndividualizedProfile {
  interests: string[];
  sensoryPreferences: string[];
  communicationModes: string[];
  preferredVisualSupports: string[];
  selfRegulationStrategies: string[];
  knownDiscomforts: string[];
  notes?: string;
}

export interface IChild {
  _id: string;
  tutorId: string;
  name: string;
  nickname?: string;
  birthDate?: string | Date;
  avatarUrl?: string;
  pinCode?: string;
  individualizedProfile: IIndividualizedProfile;
  accessibility: IChildAccessibility;
  createdAt: Date;
  updatedAt: Date;
}

// Vinculación y permisos de usuarios hacia el perfil infantil
export type AccessStatus = 'pending' | 'accepted' | 'rejected' | 'revoked';

export interface IChildAccess {
  _id: string;
  childId: string | IChild;
  userId: string | IUser;
  invitedBy: string | { _id: string; name: string; email: string };
  role: UserRole;
  status: AccessStatus;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
  child?: IChild;
}

// Rutinas visuales y pasos
export type RoutineCategory =
  | 'manana'
  | 'tarde'
  | 'noche'
  | 'escuela'
  | 'higiene'
  | 'especial';

export interface IRoutineStep {
  id: string;
  order: number;
  title: string;
  description?: string;
  iconUrl?: string;
  audioUrl?: string;
  estimatedMinutes?: number;
}

export interface IRoutine {
  _id: string;
  childId: string;
  title: string;
  description?: string;
  category: RoutineCategory;
  daysOfWeek: number[]; // 0: Domingo, 1: Lunes...
  startTime?: string; // HH:mm
  isActive: boolean;
  steps: IRoutineStep[];
  createdAt: Date;
  updatedAt: Date;
}

export type RoutineProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface IRoutineProgress {
  _id: string;
  childId: string;
  routineId: string;
  date: string; // YYYY-MM-DD
  completedStepIds: string[];
  status: RoutineProgressStatus;
  notes?: string;
  completedAt?: Date;
}

// Comunicador SAAC
export interface IAACCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

export interface IAACItem {
  id: string;
  categoryId: string;
  label: string;
  imageUrl: string;
  audioText: string;
  isQuickAccess?: boolean;
  order: number;
}

export interface IAACBoard {
  _id: string;
  childId?: string; // null para catálogo general
  name: string;
  isCustom: boolean;
  columnsCount: number;
  categories: IAACCategory[];
  items: IAACItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Actividades educativas
export type ActivityType = 'association' | 'selection' | 'sequence';
export type ActivityDifficulty = 'facil' | 'medio' | 'avanzado';

export interface IAssociationPair {
  id: string;
  leftText: string;
  leftImage?: string;
  rightText: string;
  rightImage?: string;
}

export interface ISelectionOption {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
}

export interface ISelectionQuestion {
  id: string;
  promptText: string;
  promptImage?: string;
  options: ISelectionOption[];
}

export interface ISequenceStep {
  id: string;
  order: number;
  text: string;
  imageUrl?: string;
}

export interface IActivityConfig {
  pairs?: IAssociationPair[];
  questions?: ISelectionQuestion[];
  sequence?: ISequenceStep[];
}

export interface IActivity {
  _id: string;
  title: string;
  description: string;
  skillType: string;
  activityType: ActivityType;
  difficulty: ActivityDifficulty;
  instructions: string;
  config: IActivityConfig;
  createdBy: string;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityAssignment {
  _id: string;
  childId: string;
  activityId: string;
  assignedBy: string;
  dueDate?: string | Date;
  status: 'pending' | 'completed' | 'cancelled';
  assignedAt: Date;
  activity?: IActivity;
}

export interface IActionResult {
  _id: string;
  assignmentId?: string;
  childId: string;
  activityId: string;
  score: number;
  totalItems: number;
  supportsUsed: string[];
  timeSpentSeconds: number;
  feedbackNotes?: string;
  createdAt: Date;
}

// Observaciones y Seguimiento
export type ObservationCategory =
  | 'bienestar'
  | 'sensorial'
  | 'descanso'
  | 'conductual'
  | 'social'
  | 'pedagogico';

export interface IObservation {
  _id: string;
  childId: string;
  authorId: string;
  date: Date | string;
  category: ObservationCategory;
  description: string;
  supportsUsed: string[];
  observedOutcome?: string;
  visibility: UserRole[];
  author?: IUser;
  scheduleEventId?: string;
  createdAt: Date;
}

// Objetivos Individualizados
export type GoalArea = 'comunicacion' | 'autonomia' | 'social' | 'cognitiva' | 'sensorial';
export type GoalStatus = 'propuesto' | 'en_progreso' | 'alcanzado' | 'pausado';

export interface IGoalProgressNote {
  date: Date | string;
  note: string;
  authorId: string;
  authorName?: string;
}

export interface IGoal {
  _id: string;
  childId: string;
  description: string;
  area: GoalArea;
  responsibleId: string;
  startDate: Date | string;
  targetDate?: Date | string;
  criteria: string;
  status: GoalStatus;
  progressNotes: IGoalProgressNote[];
  createdAt: Date;
  updatedAt: Date;
  responsible?: IUser;
}

// Batería Sensorial y Social Subjetiva (Sin medidas cuantitativas arbitrarias)
export type SensoryBatteryLevel = 'comodo' | 'cansado' | 'pausa' | 'sobrecarga';

export interface IBatteryLog {
  _id: string;
  childId: string;
  level: SensoryBatteryLevel;
  note?: string;
  registeredBy: 'child' | 'tutor' | 'professional' | 'teacher';
  authorId?: string;
  authorName?: string;
  createdAt: Date;
}

// Bitácora Fisiológica y Somática (Sueño, malestar, alimentación)
export type SleepQuality = 'muy_bueno' | 'bueno' | 'regular' | 'inquieto';
export type AppetiteLevel = 'normal' | 'bajo' | 'selectivo' | 'aumentado';
export type DiscomfortLevel = 'ninguno' | 'leve' | 'moderado' | 'alto';

export interface ISomaticLog {
  _id: string;
  childId: string;
  authorId: string;
  date: Date | string;
  sleepHours?: number;
  sleepQuality?: SleepQuality;
  appetite?: AppetiteLevel;
  physicalDiscomfort?: DiscomfortLevel;
  discomfortNotes?: string;
  wellbeingNote?: string;
  symptoms?: string[];
  mood?: string;
  energyLevel?: string;
  supportsUsed?: string[];
  createdAt: Date;
  author?: IUser;
}

// Registro ABC Neuroafirmativo (Antecedente ambiental, Expresión/Conducta, Apoyo brindado)
export interface IABCLog {
  _id: string;
  childId: string;
  authorId: string;
  date: Date | string;
  antecedentContext: string;
  observedBehavior: string;
  unmetNeed?: string;
  supportProvided: string;
  outcome: string;
  visibility: UserRole[];
  createdAt: Date;
  author?: IUser;
}

// Eventos no rutinarios y alertas con anticipación visual
export interface IScheduleEvent {
  _id: string;
  childId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD para períodos continuos/rachas
  startTime?: string;
  endTime?: string;
  iconEmoji: string;
  isNonRoutine: boolean;
  anticipationVisualUrl?: string;
  alertLevel: 'informativo' | 'importante' | 'cambio_fuerte';
  visualPrepNotes?: string;
  badgeStyle?: 'flower' | 'pill' | 'outlined' | 'solid';
  badgeColor?: string; // e.g. 'purple', 'rose', 'teal', 'indigo', 'amber'
  badgeLabel?: string; // e.g. 'OVULACIÓN 14' -> 'TERAPIA 14'
  createdBy: string;
  creatorRole?: UserRole;
  createdAt: Date;
}

// Cambio de planes estructurado
export interface IPlanChange {
  _id: string;
  childId: string;
  routineId?: string;
  originalActivity: string;
  newTask: string;
  nextTask?: string;
  childOptions?: string[];
  reasonNotes?: string;
  isActive: boolean;
  announcedAt: Date;
  createdAt: Date;
}

// Auditoría
export interface IAuditLog {
  _id: string;
  userId: string;
  childId?: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

