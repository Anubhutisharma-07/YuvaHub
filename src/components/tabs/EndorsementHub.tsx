import React, { useEffect, useState } from 'react';
import { Target, ThumbsUp, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface EndorsementSummary {
  skill: string;
  count: number;
  endorsers: string[];
}

export default function EndorsementHub() {
  const { user } = useAppContext();
  const [received, setReceived] = useState<EndorsementSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchEndorsements = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/v1/endorsements', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReceived(data.data?.received || []);
        }
      } catch (err) {
        console.error("Failed to fetch endorsements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEndorsements();
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-[#e8ded1] dark:border-gray-700 mt-6">
      <div className="flex items-center gap-3 mb-5">
        <ThumbsUp className="w-5 h-5 text-[#b56b37]" />
        <h3 className="text-xl font-serif font-bold text-[#231f20] dark:text-white">Skill Endorsements</h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#b56b37]" /></div>
      ) : received.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't received any skill endorsements yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {received.map(item => (
            <div key={item.skill} className="flex justify-between items-center p-4 bg-[#fcf9f2] dark:bg-gray-900 rounded-xl border border-[#e8ded1] dark:border-gray-700">
              <span className="font-bold text-[#603620] dark:text-gray-300">{item.skill}</span>
              <span className="bg-[#b56b37] text-white text-xs font-bold px-2 py-1 rounded-full">
                {item.count} {item.count === 1 ? 'Endorsement' : 'Endorsements'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
