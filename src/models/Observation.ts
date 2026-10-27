import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ObservationCategory, UserRole } from '@/types';

export interface IObservationDocument extends Document {
  childId: Types.ObjectId;
  authorId: Types.ObjectId;
  date: Date;
  category: ObservationCategory;
  description: string;
  supportsUsed: string[];
  observedOutcome?: string;
  visibility: UserRole[];
  scheduleEventId?: Types.ObjectId;
  createdAt: Date;
}

const ObservationSchema = new Schema<IObservationDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now, index: true },
    category: {
      type: String,
      enum: ['bienestar', 'sensorial', 'descanso', 'conductual', 'social', 'pedagogico'],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    supportsUsed: { type: [String], default: [] },
    observedOutcome: { type: String, default: '' },
    visibility: {
      type: [String],
      enum: ['tutor', 'professional', 'teacher'],
      default: ['tutor', 'professional', 'teacher'],
    },
    scheduleEventId: { type: Schema.Types.ObjectId, ref: 'ScheduleEvent', required: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ObservationModel: Model<IObservationDocument> =
  mongoose.models.Observation ||
  mongoose.model<IObservationDocument>('Observation', ObservationSchema);

export default ObservationModel;
