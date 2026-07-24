import { Schema, model, Types } from 'mongoose';

export interface IThemeConfidence {
  themeId: Types.ObjectId;
  confidence: number;
}

export interface IFeedback {
  content: string;
  channel: string;
  sourceRef?: string;
  customerLabel?: string;
  sentiment?: 'POS' | 'NEU' | 'NEG' | null;
  sentimentScore?: number | null;
  status: 'NEW' | 'REVIEWED' | 'ACTIONED';
  themeIds: IThemeConfidence[];
  embedding?: number[] | null;
  workspaceId: Types.ObjectId;
  needsReview?: boolean;
  createdAt?: Date;
}

const ThemeConfidenceSchema = new Schema<IThemeConfidence>({
  themeId: { type: Schema.Types.ObjectId, ref: 'Theme', required: true },
  confidence: { type: Number, required: true }
}, { _id: false });

const FeedbackSchema = new Schema<IFeedback>({
  content: { type: String, required: true },
  channel: { type: String, required: true },
  sourceRef: { type: String },
  customerLabel: { type: String },
  sentiment: {
    type: String,
    enum: ['POS', 'NEU', 'NEG', null],
    default: null
  },
  sentimentScore: {
    type: Number,
    min: -1,
    max: 1,
    default: null
  },
  status: {
    type: String,
    enum: ['NEW', 'REVIEWED', 'ACTIONED'],
    default: 'NEW',
    required: true
  },
  themeIds: {
    type: [ThemeConfidenceSchema],
    default: []
  },
  embedding: {
    type: [Number],
    default: null
  },
  needsReview: {
    type: Boolean,
    default: false
  },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Add compound indexes for fast filtered queries
FeedbackSchema.index({ workspaceId: 1, createdAt: -1 });
FeedbackSchema.index({ workspaceId: 1, status: 1 });
FeedbackSchema.index({ content: 'text' });

export const Feedback = model<IFeedback>('Feedback', FeedbackSchema);
