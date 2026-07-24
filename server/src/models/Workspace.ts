import { Schema, model } from 'mongoose';

export interface IWorkspace {
  name: string;
  createdAt?: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const Workspace = model<IWorkspace>('Workspace', WorkspaceSchema);
