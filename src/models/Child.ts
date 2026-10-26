import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IChildAccessibility, IIndividualizedProfile } from '@/types';

export interface IChildDocument extends Document {
  tutorId: Types.ObjectId;
  name: string;
  nickname?: string;
  birthDate?: Date;
  avatarUrl?: string;
  pinCode?: string; // Hash del PIN para modo infantil supervisado
  individualizedProfile: IIndividualizedProfile;
  accessibility: IChildAccessibility;
  createdAt: Date;
  updatedAt: Date;
}

const IndividualizedProfileSchema = new Schema(
  {
    interests: { type: [String], default: [] },
    sensoryPreferences: { type: [String], default: [] },
    communicationModes: { type: [String], default: [] },
    preferredVisualSupports: { type: [String], default: [] },
    selfRegulationStrategies: { type: [String], default: [] },
    knownDiscomforts: { type: [String], default: [] },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const AccessibilitySchema = new Schema(
  {
    fontSize: { type: String, enum: ['normal', 'large', 'extra-large'], default: 'large' },
    buttonSize: { type: String, enum: ['normal', 'large', 'extra-large'], default: 'large' },
    contrast: { type: String, enum: ['normal', 'high', 'soft'], default: 'normal' },
    reducedMotion: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: true },
    voiceTtsEnabled: { type: Boolean, default: true },
    voiceSpeed: { type: Number, default: 0.9, min: 0.5, max: 1.5 },
    columnsCount: { type: Number, default: 4, enum: [2, 3, 4, 6] },
  },
  { _id: false }
);

const ChildSchema = new Schema<IChildDocument>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    nickname: { type: String, trim: true },
    birthDate: { type: Date },
    avatarUrl: { type: String, default: '' },
    pinCode: { type: String },
    individualizedProfile: {
      type: IndividualizedProfileSchema,
      default: () => ({
        interests: [],
        sensoryPreferences: [],
        communicationModes: [],
        preferredVisualSupports: [],
        selfRegulationStrategies: [],
        knownDiscomforts: [],
        notes: '',
      }),
    },
    accessibility: {
      type: AccessibilitySchema,
      default: () => ({
        fontSize: 'large',
        buttonSize: 'large',
        contrast: 'normal',
        reducedMotion: true,
        soundEnabled: true,
        voiceTtsEnabled: true,
        voiceSpeed: 0.9,
        columnsCount: 4,
      }),
    },
  },
  {
    timestamps: true,
  }
);

export const ChildModel: Model<IChildDocument> =
  mongoose.models.Child || mongoose.model<IChildDocument>('Child', ChildSchema);

export default ChildModel;
