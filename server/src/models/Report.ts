import { Schema, model, Types } from 'mongoose';

export interface IReport {
  title: string;
  periodStart: Date;
  periodEnd: Date;
  contentJson: Record<string, any>;
  workspaceId: Types.ObjectId;
  generatedBy: Types.ObjectId;
  createdAt?: Date;
}

const ReportSchema = new Schema<IReport>({
  title: { type: String, required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  contentJson: { type: Schema.Types.Mixed, required: true },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const Report = model<IReport>('Report', ReportSchema);
