import mongoose, { Schema, Document } from 'mongoose';

export interface IFellowshipGrant extends Document {
  fellowshipTitle: string;
  grantProvider: string;
  eligibleDomain: string;
  stipendAmountMonthlyINR: number;
  durationMonths: number;
  aiEligibilityMatchScore: number;
  applicationDeadline: string;
  status: 'OPEN_APPLICATIONS' | 'INTERVIEW_PHASE' | 'AWARDED';
  keyRequirement: string;
  createdAt: Date;
  updatedAt: Date;
}

const FellowshipGrantSchema: Schema = new Schema(
  {
    fellowshipTitle: { type: String, required: true },
    grantProvider: { type: String, required: true },
    eligibleDomain: { type: String, required: true },
    stipendAmountMonthlyINR: { type: Number, required: true, default: 50000 },
    durationMonths: { type: Number, required: true, default: 12 },
    aiEligibilityMatchScore: { type: Number, required: true, default: 90.0 },
    applicationDeadline: { type: String, required: true, default: 'Dec 31, 2026' },
    status: { type: String, enum: ['OPEN_APPLICATIONS', 'INTERVIEW_PHASE', 'AWARDED'], default: 'OPEN_APPLICATIONS' },
    keyRequirement: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IFellowshipGrant>('FellowshipGrant', FellowshipGrantSchema);
