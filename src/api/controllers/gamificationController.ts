import { Request, Response } from 'express';
import { User } from '../../models/User';
import { ReputationLog } from '../../models/ReputationLog';
import { redisClient } from '../../config/redis';
import { logger } from '../../utils/logger';

/**
 * Fetches the real-time weekly leaderboard from Redis.
 */
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        // ZREVRANGE to get top scores
        const topUsers = await redisClient.zRange('reputation_leaderboard_weekly', 0, limit - 1, { REV: true });

        // Fetch user details for the top IDs
        const userDetails = await User.find(
            { _id: { $in: topUsers } },
            'name reputation_score level badges'
        ).sort({ reputation_score: -1 });

        res.status(200).json({ data: userDetails });
    } catch (error) {
        logger.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Fetches detailed reputation history for a specific user.
 */
export const getUserReputationHistory = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const logs = await ReputationLog.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ReputationLog.countDocuments({ userId });

        res.status(200).json({
            data: logs,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        logger.error('Error fetching user reputation history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
