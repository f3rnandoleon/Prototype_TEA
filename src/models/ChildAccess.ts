import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { AccessStatus, Permission, UserRole } from '@/types';

export interface IChildAccessDocument extends Document {
  childId: Types.ObjectId;
  userId: Types.ObjectId;
  invitedBy: Types.ObjectId;
  role: UserRole;
  status: AccessStatus;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

const ChildAccessSchema = new Schema<IChildAccessDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['tutor', 'professional', 'teacher'], required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'revoked'],
      default: 'pending',
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Índice único compuesto para evitar duplicidad de vinculación
ChildAccessSchema.index({ childId: 1, userId: 1 }, { unique: true });

export const ChildAccessModel: Model<IChildAccessDocument> =
  mongoose.models.ChildAccess ||
  mongoose.model<IChildAccessDocument>('ChildAccess', ChildAccessSchema);

export default ChildAccessModel;
