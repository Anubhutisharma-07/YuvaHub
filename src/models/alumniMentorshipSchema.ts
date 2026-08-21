import mongoose, { Schema, Document } from 'mongoose';

export interface IAlumniMentorshipSlot extends Document {
  mentorName: string;
  mentorAlumniBatchYear: number;
  mentorCurrentCompany: string;
  mentorCurrentRole: string;
  campusName: string;
  expertiseArea: 'SOFTWARE_ENGINEERING' | 'PRODUCT_MANAGEMENT' | 'AI_RESEARCH' | 'VENTURE_CAPITAL';
  availableSessionsCount: number;
  sessionDurationMinutes: number;
  matchingCompatibilityPercent: number;
  status: 'OPEN' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';
  assignedStudentId?: string;
  assignedStudentName?: string;
  sessionTopics: string;
  createdAt: Date;
  updatedAt: Date;
}

const AlumniMentorshipSlotSchema: Schema = new Schema(
  {
    mentorName: { type: String, required: true },
    mentorAlumniBatchYear: { type: Number, required: true },
    mentorCurrentCompany: { type: String, required: true },
    mentorCurrentRole: { type: String, required: true },
    campusName: { type: String, required: true, index: true },
    expertiseArea: {
      type: String,
      enum: ['SOFTWARE_ENGINEERING', 'PRODUCT_MANAGEMENT', 'AI_RESEARCH', 'VENTURE_CAPITAL'],
      default: 'SOFTWARE_ENGINEERING',
      required: true,
    },
    availableSessionsCount: { type: Number, required: true, min: 1 },
    sessionDurationMinutes: { type: Number, default: 45 },
    matchingCompatibilityPercent: { type: Number, default: 95, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['OPEN', 'BOOKED', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
      required: true,
    },
    assignedStudentId: { type: String, default: null },
    assignedStudentName: { type: String, default: null },
    sessionTopics: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.AlumniMentorshipSlot ||
  mongoose.model<IAlumniMentorshipSlot>('AlumniMentorshipSlot', AlumniMentorshipSlotSchema);
