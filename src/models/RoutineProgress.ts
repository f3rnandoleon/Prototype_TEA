import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { RoutineProgressStatus } from '@/types';

export interface IRoutineProgressDocument extends Document {
  childId: Types.ObjectId;
  routineId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  completedStepIds: string[];
  status: RoutineProgressStatus;
  notes?: string;
  completedAt?: Date;
}

const RoutineProgressSchema = new Schema<IRoutineProgressDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    routineId: { type: Schema.Types.ObjectId, ref: 'Routine', required: true, index: true },
    date: { type: String, required: true, index: true },
    completedStepIds: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'skipped'],
      default: 'not_started',
    },
    notes: { type: String, default: '' },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

RoutineProgressSchema.index({ childId: 1, routineId: 1, date: 1 }, { unique: true });

export const RoutineProgressModel: Model<IRoutineProgressDocument> =
  mongoose.models.RoutineProgress ||
  mongoose.model<IRoutineProgressDocument>('RoutineProgress', RoutineProgressSchema);

export default RoutineProgressModel;
