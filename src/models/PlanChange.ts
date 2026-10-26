import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPlanChangeDocument extends Document {
  childId: Types.ObjectId;
  routineId?: Types.ObjectId;
  originalActivity: string;
  newTask: string;
  nextTask?: string;
  childOptions?: string[];
  reasonNotes?: string;
  isActive: boolean;
  announcedAt: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlanChangeSchema = new Schema<IPlanChangeDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    routineId: { type: Schema.Types.ObjectId, ref: 'Routine' },
    originalActivity: { type: String, required: true },
    newTask: { type: String, required: true },
    nextTask: { type: String, default: '' },
    childOptions: { type: [String], default: [] },
    reasonNotes: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    announcedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

export const PlanChangeModel: Model<IPlanChangeDocument> =
  mongoose.models.PlanChange ||
  mongoose.model<IPlanChangeDocument>('PlanChange', PlanChangeSchema);

export default PlanChangeModel;
