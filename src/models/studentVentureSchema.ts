import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentVentureFund extends Document {
  startupName: string;
  campusName: string;
  studentFounderName: string;
  sectorDomain: 'FINTECH' | 'HEALTH_TECH' | 'ED_TECH' | 'SAAS' | 'HARDWARE';
  fundingStage: 'PRE_SEED' | 'SEED' | 'SERIES_A' | 'STUDENT_GRANT';
  targetInvestmentUsd: number;
  committedInvestmentUsd: number;
  investorCount: number;
  investmentStatus: 'OPEN' | 'DUE_DILIGENCE' | 'FULLY_COMMITTED' | 'DISBURSED';
  pitchDeckUrl: string;
  executiveSummary: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentVentureFundSchema: Schema = new Schema(
  {
    startupName: { type: String, required: true },
    campusName: { type: String, required: true, index: true },
    studentFounderName: { type: String, required: true },
    sectorDomain: {
      type: String,
      enum: ['FINTECH', 'HEALTH_TECH', 'ED_TECH', 'SAAS', 'HARDWARE'],
      default: 'SAAS',
      required: true,
    },
    fundingStage: {
      type: String,
      enum: ['PRE_SEED', 'SEED', 'SERIES_A', 'STUDENT_GRANT'],
      default: 'PRE_SEED',
      required: true,
    },
    targetInvestmentUsd: { type: Number, required: true, min: 1000 },
    committedInvestmentUsd: { type: Number, default: 0, min: 0 },
    investorCount: { type: Number, default: 0, min: 0 },
    investmentStatus: {
      type: String,
      enum: ['OPEN', 'DUE_DILIGENCE', 'FULLY_COMMITTED', 'DISBURSED'],
      default: 'OPEN',
      required: true,
    },
    pitchDeckUrl: { type: String, default: '#' },
    executiveSummary: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.StudentVentureFund ||
  mongoose.model<IStudentVentureFund>('StudentVentureFund', StudentVentureFundSchema);
