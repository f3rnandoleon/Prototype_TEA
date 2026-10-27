import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IChildSessionCommand {
  commandId: string;
  action: 'navigate' | 'speak' | 'lock' | 'unlock';
  targetRoute?: string;
  message?: string;
  speakVoice?: boolean;
  locked?: boolean;
  createdAt: Date;
  executedAt?: Date | null;
}

export interface IChildSessionControlDocument extends Document {
  childId: Types.ObjectId;
  lastHeartbeat: Date;
  currentRoute: string;
  currentSection: string;
  activeCommand?: IChildSessionCommand | null;
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChildSessionControlSchema = new Schema<IChildSessionControlDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, unique: true, index: true },
    lastHeartbeat: { type: Date, default: Date.now },
    currentRoute: { type: String, default: '' },
    currentSection: { type: String, default: 'En espera' },
    activeCommand: {
      type: {
        commandId: { type: String, required: true },
        action: { type: String, enum: ['navigate', 'speak', 'lock', 'unlock'], required: true },
        targetRoute: { type: String },
        message: { type: String },
        speakVoice: { type: Boolean, default: true },
        locked: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        executedAt: { type: Date, default: null },
      },
      default: null,
    },
    locked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ChildSessionControlModel: Model<IChildSessionControlDocument> =
  mongoose.models.ChildSessionControl ||
  mongoose.model<IChildSessionControlDocument>('ChildSessionControl', ChildSessionControlSchema);

export default ChildSessionControlModel;
