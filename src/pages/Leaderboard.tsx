import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Medal, Crown } from "lucide-react";
import { fetchLeaderboard } from "../services/apiClient";

interface LeaderboardUser {
  uid: string;
  name: string;
  avatarUrl?: string;
  points: number;
  badges?: string[];
}

export const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLeaderboard = async () => {
      try {
        const response = await fetchLeaderboard();
        setUsers(response.data?.leaderboard || []);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    getLeaderboard();
  }, []);

  const getRankHighlight = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-yellow-500/50 shadow-lg scale-105 border-yellow-300 border-2";
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-gray-400/50 shadow-md scale-102 border-gray-200 border-2";
      case 2:
        return "bg-gradient-to-r from-amber-600 to-orange-800 text-white shadow-orange-700/50 shadow-md scale-102 border-amber-500 border-2";
      default:
        return "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700";
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-100" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-100" />;
      case 2:
        return <Award className="w-6 h-6 text-orange-100" />;
      default:
        return <span className="font-bold text-gray-500 dark:text-gray-400">#{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading Leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen filter"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/50 rounded-2xl mb-4">
            <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
            Global Leaderboard
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Top contributors making a difference in the YuvaHub community. Earn points by helping others, sharing resources, and being active!
          </p>
        </motion.div>

        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No users found. Be the first to earn points!</p>
            </div>
          ) : (
            users.map((user, index) => (
              <motion.div
                key={user.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative flex items-center p-4 sm:p-6 rounded-2xl backdrop-blur-sm ${getRankHighlight(index)}`}
              >
                <div className="flex-shrink-0 w-12 text-center flex justify-center">
                  {getRankIcon(index)}
                </div>

                <div className="flex-shrink-0 mx-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-white/20">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-grow min-w-0">
                  <h2 className="text-lg font-bold truncate">
                    {user.name}
                  </h2>
                  {user.badges && user.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.badges.map((badge, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-black/10 dark:bg-white/10 backdrop-blur-md">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 text-right ml-4">
                  <div className="text-2xl font-black tracking-tight">
                    {user.points.toLocaleString()}
                  </div>
                  <div className="text-xs uppercase tracking-wider opacity-80 font-semibold">
                    Points
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
