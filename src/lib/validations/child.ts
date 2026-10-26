import { z } from 'zod';

export const accessibilitySchema = z.object({
  fontSize: z.enum(['normal', 'large', 'extra-large']).default('large'),
  buttonSize: z.enum(['normal', 'large', 'extra-large']).default('large'),
  contrast: z.enum(['normal', 'high', 'soft']).default('normal'),
  reducedMotion: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
  voiceTtsEnabled: z.boolean().default(true),
  voiceSpeed: z.number().min(0.5).max(1.5).default(0.9),
  columnsCount: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(6)]).default(4),
});

export const individualizedProfileSchema = z.object({
  interests: z.array(z.string()).default([]),
  sensoryPreferences: z.array(z.string()).default([]),
  communicationModes: z.array(z.string()).default([]),
  preferredVisualSupports: z.array(z.string()).default([]),
  selfRegulationStrategies: z.array(z.string()).default([]),
  knownDiscomforts: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional().default(''),
});

export const createChildSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  nickname: z.string().max(80).optional(),
  birthDate: z.string().optional(),
  avatarUrl: z.string().url('URL de avatar inválida').optional().or(z.literal('')),
  pinCode: z.string().regex(/^\d{4}$/, 'El PIN debe ser de 4 dígitos').optional().or(z.literal('')),
  individualizedProfile: individualizedProfileSchema.optional(),
  accessibility: accessibilitySchema.optional(),
});

export const updateChildSchema = createChildSchema.partial();

export type CreateChildInput = z.infer<typeof createChildSchema>;
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
