import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IActionResultDocument extends Document {
  assignmentId?: Types.ObjectId;
  childId: Types.ObjectId;
  activityId: Types.ObjectId;
  score: number;
  totalItems: number;
  supportsUsed: string[];
  timeSpentSeconds: number;
  feedbackNotes?: string;
  createdAt: Date;
}

const ActivityResultSchema = new Schema<IActionResultDocument>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'ActivityAssignment' },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    activityId: { type: Schema.Types.ObjectId, ref: 'Activity', required: true, index: true },
    score: { type: Number, required: true, default: 0 },
    totalItems: { type: Number, required: true, default: 0 },
    supportsUsed: { type: [String], default: [] },
    timeSpentSeconds: { type: Number, default: 0 },
    feedbackNotes: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ActivityResultModel: Model<IActionResultDocument> =
  mongoose.models.ActivityResult ||
  mongoose.model<IActionResultDocument>('ActivityResult', ActivityResultSchema);

export default ActivityResultModel;
