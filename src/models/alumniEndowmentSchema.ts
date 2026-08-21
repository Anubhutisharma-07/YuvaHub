import mongoose, { Schema, Document } from 'mongoose';

export interface IAlumniEndowmentFund extends Document {
  fundName: string;
  campusName: string;
  donorName: string;
  donorAlumniBatchYear: number;
  fundCategory: 'RESEARCH_GRANT' | 'STUDENT_SCHOLARSHIP' | 'LAB_EQUIPMENT' | 'HACKATHON_SPONSORSHIP';
  targetAmountUsd: number;
  currentAmountRaisedUsd: number;
  totalDonorsCount: number;
  grantStatus: 'ACTIVE' | 'FULLY_FUNDED' | 'DISBURSED' | 'PAUSED';
  matchingGrantEnabled: boolean;
  matchingRatio: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const AlumniEndowmentFundSchema: Schema = new Schema(
  {
    fundName: { type: String, required: true },
    campusName: { type: String, required: true, index: true },
    donorName: { type: String, required: true },
    donorAlumniBatchYear: { type: Number, required: true },
    fundCategory: {
      type: String,
      enum: ['RESEARCH_GRANT', 'STUDENT_SCHOLARSHIP', 'LAB_EQUIPMENT', 'HACKATHON_SPONSORSHIP'],
      default: 'STUDENT_SCHOLARSHIP',
      required: true,
    },
    targetAmountUsd: { type: Number, required: true, min: 100 },
    currentAmountRaisedUsd: { type: Number, default: 0, min: 0 },
    totalDonorsCount: { type: Number, default: 1, min: 0 },
    grantStatus: {
      type: String,
      enum: ['ACTIVE', 'FULLY_FUNDED', 'DISBURSED', 'PAUSED'],
      default: 'ACTIVE',
      required: true,
    },
    matchingGrantEnabled: { type: Boolean, default: false },
    matchingRatio: { type: Number, default: 1.0 },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.AlumniEndowmentFund ||
  mongoose.model<IAlumniEndowmentFund>('AlumniEndowmentFund', AlumniEndowmentFundSchema);
