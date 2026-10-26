import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IAACCategory, IAACItem } from '@/types';

export interface IAACBoardDocument extends Document {
  childId?: Types.ObjectId;
  name: string;
  isCustom: boolean;
  columnsCount: number;
  categories: IAACCategory[];
  items: IAACItem[];
  createdAt: Date;
  updatedAt: Date;
}

const AACCategorySchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: 'Folder' },
    color: { type: String, default: '#E0F2FE' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const AACItemSchema = new Schema(
  {
    id: { type: String, required: true },
    categoryId: { type: String, required: true },
    label: { type: String, required: true },
    imageUrl: { type: String, required: true },
    audioText: { type: String, required: true },
    isQuickAccess: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const AACBoardSchema = new Schema<IAACBoardDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', index: true },
    name: { type: String, required: true, default: 'Tablero Principal' },
    isCustom: { type: Boolean, default: false },
    columnsCount: { type: Number, default: 4, enum: [2, 3, 4, 6] },
    categories: { type: [AACCategorySchema], default: [] },
    items: { type: [AACItemSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const AACBoardModel: Model<IAACBoardDocument> =
  mongoose.models.AACBoard || mongoose.model<IAACBoardDocument>('AACBoard', AACBoardSchema);

export default AACBoardModel;
