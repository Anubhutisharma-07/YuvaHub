import { Request, Response } from 'express';
 feature/enterprise-observability-hub-851
import { User } from '../../models/User.js';
import { ReputationLog } from '../../models/ReputationLog.js';
import { redis as redisClient } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';

import { User } from '../../models/User';
import { ReputationLog } from '../../models/ReputationLog';
import { redisClient } from '../redis';
import { logger } from '../../utils/logger';
 main

/**
 * Fetches the real-time weekly leaderboard from Redis.
 */
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        // ZREVRANGE to get top scores
        const topUsers = await redisClient.zrange('reputation_leaderboard_weekly', 0, limit - 1, 'REV');

        // Fetch user details for the top IDs
        const userDetails = await User.find(
            { _id: { $in: topUsers } },
            'name reputation_score level badges'
        ).sort({ reputation_score: -1 });

        res.status(200).json({ data: userDetails });
    } catch (error) {
 feature/enterprise-observability-hub-851
        (logger.error as any)({ error }, 'Error fetching leaderboard:');

        logger.error({ error }, 'Error fetching leaderboard:');
 main
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
 feature/enterprise-observability-hub-851
        (logger.error as any)({ error }, 'Error fetching user reputation history:');

        logger.error({ error }, 'Error fetching user reputation history:');
 main
        res.status(500).json({ error: 'Internal server error' });
    }
};
