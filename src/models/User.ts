import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    reputation_score: number;
    level: number;
    badges: string[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        reputation_score: { type: Number, default: 0, min: 0 },
        badges: { type: [String], default: [] },
        level: { type: Number, default: 1, min: 1 },
    },
    { timestamps: true }
);

// Pre-save hook to calculate level based on reputation score
 feat/webrtc-collaborative-study-room-895
userSchema.pre('save', function (this: any) {
    if (this.isModified && this.isModified('reputation_score')) {
        this.level = Math.floor(Math.sqrt((this.reputation_score || 0) / 100)) + 1;

userSchema.pre('save', function (next: any) {
    if (this.isModified('reputation_score')) {
        // Simple leveling formula: Level = floor(sqrt(reputation_score / 100)) + 1
        this.level = Math.floor(Math.sqrt(this.reputation_score / 100)) + 1;
 main

        const newBadges: string[] = [];
        if (this.reputation_score >= 100) newBadges.push('Novice');
        if (this.reputation_score >= 500) newBadges.push('Contributor');
        if (this.reputation_score >= 1000) newBadges.push('Expert');
        if (this.reputation_score >= 5000) newBadges.push('Legend');

        this.badges = Array.from(new Set([...(this.badges || []), ...newBadges]));
    }
});

export const User = mongoose.model<IUser>('User', userSchema);
