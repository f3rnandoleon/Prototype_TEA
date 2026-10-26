import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { UserRole } from '@/types';

export interface IABCLogDocument extends Document {
  childId: Types.ObjectId;
  authorId: Types.ObjectId;
  date: Date;
  antecedentContext: string;
  observedBehavior: string;
  unmetNeed?: string;
  supportProvided: string;
  outcome: string;
  visibility: UserRole[];
  createdAt: Date;
}

const ABCLogSchema = new Schema<IABCLogDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now, index: true },
    antecedentContext: { type: String, required: true },
    observedBehavior: { type: String, required: true },
    unmetNeed: { type: String, default: '' },
    supportProvided: { type: String, required: true },
    outcome: { type: String, required: true },
    visibility: {
      type: [String],
      enum: ['tutor', 'professional', 'teacher'],
      default: ['tutor', 'professional', 'teacher'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ABCLogModel: Model<IABCLogDocument> =
  mongoose.models.ABCLog || mongoose.model<IABCLogDocument>('ABCLog', ABCLogSchema);

export default ABCLogModel;
