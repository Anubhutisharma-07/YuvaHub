import mongoose, { Schema, Document } from 'mongoose';

export interface IHackathonSubmission extends Document {
  projectName: string;
  trackName: string;
  teamLead: string;
  technicalComplexityScore: number;
  innovationOriginalityScore: number;
  codeQualityScore: number;
  totalWeightedScore: number;
  judgeStatus: 'EVALUATED' | 'UNDER_REVIEW' | 'FLAGGED_PLAGIARISM';
  githubRepoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const HackathonSubmissionSchema: Schema = new Schema(
  {
    projectName: { type: String, required: true },
    trackName: { type: String, required: true },
    teamLead: { type: String, required: true },
    technicalComplexityScore: { type: Number, required: true, default: 90.0 },
    innovationOriginalityScore: { type: Number, required: true, default: 90.0 },
    codeQualityScore: { type: Number, required: true, default: 90.0 },
    totalWeightedScore: { type: Number, required: true, default: 90.0 },
    judgeStatus: { type: String, enum: ['EVALUATED', 'UNDER_REVIEW', 'FLAGGED_PLAGIARISM'], default: 'UNDER_REVIEW' },
    githubRepoUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IHackathonSubmission>('HackathonSubmission', HackathonSubmissionSchema);
