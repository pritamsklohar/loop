import { Schema, model, Types } from 'mongoose';

export interface ITheme {
  name: string;
  description: string;
  color: string;
  workspaceId: Types.ObjectId;
}

const ThemeSchema = new Schema<ITheme>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  color: { type: String, required: true },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  }
});

export const Theme = model<ITheme>('Theme', ThemeSchema);
