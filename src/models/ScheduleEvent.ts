import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { UserRole } from '@/types';

export interface IScheduleEventDocument extends Document {
  childId: Types.ObjectId;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD para rachas/períodos continuos
  startTime?: string;
  endTime?: string;
  iconEmoji: string;
  isNonRoutine: boolean;
  anticipationVisualUrl?: string;
  alertLevel: 'informativo' | 'importante' | 'cambio_fuerte';
  visualPrepNotes?: string;
  badgeStyle?: 'flower' | 'pill' | 'outlined' | 'solid';
  badgeColor?: string;
  badgeLabel?: string;
  createdBy: Types.ObjectId;
  creatorRole?: UserRole;
  createdAt: Date;
}

const ScheduleEventSchema = new Schema<IScheduleEventDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    endDate: { type: String, default: '' },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '' },
    iconEmoji: { type: String, default: '📅' },
    isNonRoutine: { type: Boolean, default: true },
    anticipationVisualUrl: { type: String, default: '' },
    alertLevel: {
      type: String,
      enum: ['informativo', 'importante', 'cambio_fuerte'],
      default: 'informativo',
    },
    visualPrepNotes: { type: String, default: '' },
    badgeStyle: {
      type: String,
      enum: ['flower', 'pill', 'outlined', 'solid'],
      default: 'pill',
    },
    badgeColor: { type: String, default: 'purple' },
    badgeLabel: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    creatorRole: {
      type: String,
      enum: ['tutor', 'professional', 'teacher'],
      default: 'tutor',
    },
  },
  {
    timestamps: true,
  }
);

export const ScheduleEventModel: Model<IScheduleEventDocument> =
  mongoose.models.ScheduleEvent ||
  mongoose.model<IScheduleEventDocument>('ScheduleEvent', ScheduleEventSchema);

export default ScheduleEventModel;
