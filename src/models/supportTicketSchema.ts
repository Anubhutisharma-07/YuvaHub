import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  ticketNumber: string;
  subject: string;
  category: string;
  studentName: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'RESOLVED' | 'IN_PROGRESS' | 'PENDING_ADMIN';
  aiSuggestedSolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema: Schema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    category: { type: String, required: true },
    studentName: { type: String, required: true },
    priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    status: { type: String, enum: ['RESOLVED', 'IN_PROGRESS', 'PENDING_ADMIN'], default: 'IN_PROGRESS' },
    aiSuggestedSolution: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
