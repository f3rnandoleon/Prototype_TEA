import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { GoalArea, GoalStatus } from '@/types';

export interface IGoalProgressNoteSubdoc {
  date: Date;
  note: string;
  authorId: Types.ObjectId;
}

export interface IGoalDocument extends Document {
  childId: Types.ObjectId;
  description: string;
  area: GoalArea;
  responsibleId: Types.ObjectId;
  startDate: Date;
  targetDate?: Date;
  criteria: string;
  status: GoalStatus;
  progressNotes: IGoalProgressNoteSubdoc[];
  createdAt: Date;
  updatedAt: Date;
}

const GoalProgressNoteSchema = new Schema(
  {
    date: { type: Date, default: Date.now },
    note: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const GoalSchema = new Schema<IGoalDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    description: { type: String, required: true },
    area: {
      type: String,
      enum: ['comunicacion', 'autonomia', 'social', 'cognitiva', 'sensorial'],
      required: true,
      index: true,
    },
    responsibleId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, default: Date.now },
    targetDate: { type: Date },
    criteria: { type: String, required: true },
    status: {
      type: String,
      enum: ['propuesto', 'en_progreso', 'alcanzado', 'pausado'],
      default: 'propuesto',
      index: true,
    },
    progressNotes: { type: [GoalProgressNoteSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const GoalModel: Model<IGoalDocument> =
  mongoose.models.Goal || mongoose.model<IGoalDocument>('Goal', GoalSchema);

export default GoalModel;
