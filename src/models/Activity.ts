import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ActivityDifficulty, ActivityType, IActivityConfig } from '@/types';

export interface IActivityDocument extends Document {
  title: string;
  description: string;
  skillType: string;
  activityType: ActivityType;
  difficulty: ActivityDifficulty;
  instructions: string;
  config: IActivityConfig;
  createdBy: Types.ObjectId;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivityDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    skillType: { type: String, required: true, default: 'Atención y Reconocimiento' },
    activityType: {
      type: String,
      enum: ['association', 'selection', 'sequence'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['facil', 'medio', 'avanzado'],
      default: 'facil',
    },
    instructions: { type: String, default: '' },
    config: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isTemplate: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ActivityModel: Model<IActivityDocument> =
  mongoose.models.Activity || mongoose.model<IActivityDocument>('Activity', ActivitySchema);

export default ActivityModel;
