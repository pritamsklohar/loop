import { Schema, model, Types } from 'mongoose';

export interface ISourceItem {
  feedbackId: string;
  snippet: string;
}

export interface IMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: ISourceItem[];
  createdAt: Date;
}

export interface IChatSession {
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  messages: IMessage[];
  updatedAt: Date;
}

const SourceItemSchema = new Schema<ISourceItem>({
  feedbackId: { type: String, required: true },
  snippet: { type: String, required: true }
}, { _id: false });

const MessageSchema = new Schema<IMessage>({
  id: { type: String, required: true },
  sender: { type: String, enum: ['user', 'ai'], required: true },
  text: { type: String, required: true },
  sources: { type: [SourceItemSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ChatSessionSchema = new Schema<IChatSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  messages: {
    type: [MessageSchema],
    default: []
  }
}, {
  timestamps: true
});

export const ChatSession = model<IChatSession>('ChatSession', ChatSessionSchema);
