import mongoose, { Schema, Document } from 'mongoose';

export interface IMentalWellnessCheckIn extends Document {
  studentId: string;
  studentName: string;
  campusName: string;
  moodRating: number; // 1 to 5 scale
  stressLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  burnoutScorePercent: number;
  primaryStressor: 'ACADEMICS' | 'EXAMS' | 'JOB_HUNT' | 'FINANCES' | 'PERSONAL';
  supportRequested: boolean;
  counselorAssigned?: string;
  sessionStatus: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'RESOLVED';
  confidentialNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MentalWellnessCheckInSchema: Schema = new Schema(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    campusName: { type: String, required: true, index: true },
    moodRating: { type: Number, required: true, min: 1, max: 5 },
    stressLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
      default: 'MODERATE',
      required: true,
    },
    burnoutScorePercent: { type: Number, required: true, min: 0, max: 100 },
    primaryStressor: {
      type: String,
      enum: ['ACADEMICS', 'EXAMS', 'JOB_HUNT', 'FINANCES', 'PERSONAL'],
      default: 'ACADEMICS',
      required: true,
    },
    supportRequested: { type: Boolean, default: false },
    counselorAssigned: { type: String, default: null },
    sessionStatus: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'COMPLETED', 'RESOLVED'],
      default: 'PENDING',
      required: true,
    },
    confidentialNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.MentalWellnessCheckIn ||
  mongoose.model<IMentalWellnessCheckIn>('MentalWellnessCheckIn', MentalWellnessCheckInSchema);
