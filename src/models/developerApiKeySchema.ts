import mongoose, { Schema, Document } from 'mongoose';

export interface IDeveloperApiKey extends Document {
  keyName: string;
  environment: 'PRODUCTION' | 'STAGING' | 'SANDBOX';
  apiKeyMasked: string;
  monthlyQuotaUsagePercent: number;
  rateLimitReqSec: number;
  allowedIpRanges: string;
  status: 'ACTIVE' | 'RATE_LIMITED' | 'REVOKED';
  createdAt: Date;
  updatedAt: Date;
}

const DeveloperApiKeySchema: Schema = new Schema(
  {
    keyName: { type: String, required: true },
    environment: { type: String, enum: ['PRODUCTION', 'STAGING', 'SANDBOX'], default: 'PRODUCTION' },
    apiKeyMasked: { type: String, required: true },
    monthlyQuotaUsagePercent: { type: Number, required: true, default: 0.0 },
    rateLimitReqSec: { type: Number, required: true, default: 50 },
    allowedIpRanges: { type: String, required: true, default: '0.0.0.0/0' },
    status: { type: String, enum: ['ACTIVE', 'RATE_LIMITED', 'REVOKED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export default mongoose.model<IDeveloperApiKey>('DeveloperApiKey', DeveloperApiKeySchema);
