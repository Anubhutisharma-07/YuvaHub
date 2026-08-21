import React from 'react';
import { IncidentMetrics } from '../../types/incidents';
import { Clock, ShieldCheck, Heart, AlertCircle } from 'lucide-react';

interface SlaMetricsProps {
    metrics: IncidentMetrics | null;
}

export const SlaMetrics: React.FC<SlaMetricsProps> = ({ metrics }) => {
    if (!metrics) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 bg-white/50 border border-slate-200 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-300">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Open Tickets</p>
                    <p className="text-2xl font-black text-slate-800">{metrics.openTickets}</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-300">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Clock className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg Resolution</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-black text-slate-800">{metrics.averageResolutionTimeHours}</p>
                        <p className="text-sm font-semibold text-slate-400">hours</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-300">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">SLA Compliance</p>
                    <p className="text-2xl font-black text-slate-800">{metrics.slaComplianceRate}%</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-300">
                <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
                    <Heart className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">CSAT Score</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-black text-slate-800">{metrics.csatScore}</p>
                        <p className="text-sm font-semibold text-slate-400">/ 5.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
