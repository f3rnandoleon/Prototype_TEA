import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IActivityAssignmentDocument extends Document {
  childId: Types.ObjectId;
  activityId: Types.ObjectId;
  assignedBy: Types.ObjectId;
  dueDate?: Date;
  status: 'pending' | 'completed' | 'cancelled';
  assignedAt: Date;
}

const ActivityAssignmentSchema = new Schema<IActivityAssignmentDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    activityId: { type: Schema.Types.ObjectId, ref: 'Activity', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    assignedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const ActivityAssignmentModel: Model<IActivityAssignmentDocument> =
  mongoose.models.ActivityAssignment ||
  mongoose.model<IActivityAssignmentDocument>('ActivityAssignment', ActivityAssignmentSchema);

export default ActivityAssignmentModel;
