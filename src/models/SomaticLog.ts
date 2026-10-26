import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { SleepQuality, AppetiteLevel, DiscomfortLevel } from '@/types';

export interface ISomaticLogDocument extends Document {
  childId: Types.ObjectId;
  authorId: Types.ObjectId;
  date: Date;
  sleepHours?: number;
  sleepQuality?: SleepQuality;
  appetite?: AppetiteLevel;
  physicalDiscomfort?: DiscomfortLevel;
  discomfortNotes?: string;
  wellbeingNote?: string;
  createdAt: Date;
}

const SomaticLogSchema = new Schema<ISomaticLogDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now, index: true },
    sleepHours: { type: Number, min: 0, max: 24 },
    sleepQuality: {
      type: String,
      enum: ['muy_bueno', 'bueno', 'regular', 'inquieto'],
      default: 'bueno',
    },
    appetite: {
      type: String,
      enum: ['normal', 'bajo', 'selectivo', 'aumentado'],
      default: 'normal',
    },
    physicalDiscomfort: {
      type: String,
      enum: ['ninguno', 'leve', 'moderado', 'alto'],
      default: 'ninguno',
    },
    discomfortNotes: { type: String, default: '' },
    wellbeingNote: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const SomaticLogModel: Model<ISomaticLogDocument> =
  mongoose.models.SomaticLog ||
  mongoose.model<ISomaticLogDocument>('SomaticLog', SomaticLogSchema);

export default SomaticLogModel;
