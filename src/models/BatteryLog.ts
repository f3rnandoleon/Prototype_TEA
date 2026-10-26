import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { SensoryBatteryLevel } from '@/types';

export interface IBatteryLogDocument extends Document {
  childId: Types.ObjectId;
  level: SensoryBatteryLevel;
  note?: string;
  registeredBy: 'child' | 'tutor' | 'professional' | 'teacher';
  authorId?: Types.ObjectId;
  authorName?: string;
  createdAt: Date;
}

const BatteryLogSchema = new Schema<IBatteryLogDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    level: {
      type: String,
      enum: ['comodo', 'cansado', 'pausa', 'sobrecarga'],
      required: true,
      index: true,
    },
    note: { type: String, default: '' },
    registeredBy: {
      type: String,
      enum: ['child', 'tutor', 'professional', 'teacher'],
      default: 'child',
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const BatteryLogModel: Model<IBatteryLogDocument> =
  mongoose.models.BatteryLog ||
  mongoose.model<IBatteryLogDocument>('BatteryLog', BatteryLogSchema);

export default BatteryLogModel;
