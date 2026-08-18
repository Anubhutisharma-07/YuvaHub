import mongoose, { Schema, Document } from 'mongoose';

export interface IIncubationStartup extends Document {
  startupName: string;
  sectorDomain: string;
  foundingLead: string;
  totalGrantDisbursedINR: number;
  milestoneStage: 'MILESTONE_1_MVP' | 'MILESTONE_2_TRACTION' | 'MILESTONE_3_SCALE';
  investorReadinessScore: number;
  cohortYear: string;
  status: 'GRANT_APPROVED' | 'IN_AUDIT' | 'FUNDED';
  keyTractionMetric: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncubationStartupSchema: Schema = new Schema(
  {
    startupName: { type: String, required: true },
    sectorDomain: { type: String, required: true },
    foundingLead: { type: String, required: true },
    totalGrantDisbursedINR: { type: Number, required: true, default: 0 },
    milestoneStage: { type: String, enum: ['MILESTONE_1_MVP', 'MILESTONE_2_TRACTION', 'MILESTONE_3_SCALE'], default: 'MILESTONE_1_MVP' },
    investorReadinessScore: { type: Number, required: true, default: 80.0 },
    cohortYear: { type: String, required: true, default: 'Cohort 2026-Q1' },
    status: { type: String, enum: ['GRANT_APPROVED', 'IN_AUDIT', 'FUNDED'], default: 'IN_AUDIT' },
    keyTractionMetric: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IIncubationStartup>('IncubationStartup', IncubationStartupSchema);
