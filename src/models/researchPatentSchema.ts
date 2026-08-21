import mongoose, { Schema, Document } from 'mongoose';

export interface IResearchPatentIp extends Document {
  patentTitle: string;
  campusName: string;
  leadInventorName: string;
  patentApplicationNumber: string;
  technologyDomain: 'ARTIFICIAL_INTELLIGENCE' | 'BIOTECH' | 'CLEANTECH' | 'QUANTUM' | 'SEMICONDUCTORS';
  patentStatus: 'FILED' | 'GRANTED' | 'LICENSED' | 'COMMERCIALIZED';
  licensingFeeUsd: number;
  royaltySharePercent: number;
  commercialPartnerAssigned?: string;
  abstractDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchPatentIpSchema: Schema = new Schema(
  {
    patentTitle: { type: String, required: true },
    campusName: { type: String, required: true, index: true },
    leadInventorName: { type: String, required: true },
    patentApplicationNumber: { type: String, required: true, unique: true },
    technologyDomain: {
      type: String,
      enum: ['ARTIFICIAL_INTELLIGENCE', 'BIOTECH', 'CLEANTECH', 'QUANTUM', 'SEMICONDUCTORS'],
      default: 'ARTIFICIAL_INTELLIGENCE',
      required: true,
    },
    patentStatus: {
      type: String,
      enum: ['FILED', 'GRANTED', 'LICENSED', 'COMMERCIALIZED'],
      default: 'FILED',
      required: true,
    },
    licensingFeeUsd: { type: Number, required: true, min: 0 },
    royaltySharePercent: { type: Number, default: 5.0, min: 0, max: 100 },
    commercialPartnerAssigned: { type: String, default: null },
    abstractDescription: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.ResearchPatentIp ||
  mongoose.model<IResearchPatentIp>('ResearchPatentIp', ResearchPatentIpSchema);
