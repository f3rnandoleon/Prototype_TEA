import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { RoutineCategory } from '@/types';

export interface IRoutineStepSubdoc {
  id: string;
  order: number;
  title: string;
  description?: string;
  iconUrl?: string;
  audioUrl?: string;
  estimatedMinutes?: number;
}

export interface IRoutineDocument extends Document {
  childId: Types.ObjectId;
  title: string;
  description?: string;
  category: RoutineCategory;
  daysOfWeek: number[];
  startTime?: string;
  isActive: boolean;
  steps: IRoutineStepSubdoc[];
  createdAt: Date;
  updatedAt: Date;
}

const RoutineStepSchema = new Schema(
  {
    id: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    iconUrl: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    estimatedMinutes: { type: Number, default: 10 },
  },
  { _id: false }
);

const RoutineSchema = new Schema<IRoutineDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['manana', 'tarde', 'noche', 'escuela', 'higiene', 'especial'],
      default: 'manana',
    },
    daysOfWeek: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
    startTime: { type: String, default: '08:00' },
    isActive: { type: Boolean, default: true },
    steps: { type: [RoutineStepSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const RoutineModel: Model<IRoutineDocument> =
  mongoose.models.Routine || mongoose.model<IRoutineDocument>('Routine', RoutineSchema);

export default RoutineModel;
