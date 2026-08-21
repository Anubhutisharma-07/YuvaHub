import React from 'react';
import { ComplianceFramework } from '../../types/compliance';
import { Shield, TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert } from 'lucide-react';

interface RegulationMetricsProps {
    frameworks: ComplianceFramework[];
    isLoading: boolean;
}

export const RegulationMetrics: React.FC<RegulationMetricsProps> = ({ frameworks, isLoading }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`loading-${i}`} className="h-32 bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 p-6 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
            </div>
        );
    }

    const getTrendIcon = (trend: ComplianceFramework['trend']) => {
        switch (trend) {
            case 'IMPROVING': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
            case 'DEGRADING': return <TrendingDown className="h-4 w-4 text-red-500" />;
            case 'STABLE': return <Minus className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {frameworks.map((fw) => {
                const isHealthy = fw.overallScore >= 90;
                const progressPercentage = (fw.controlsPassed / fw.controlsTotal) * 100;

                return (
                    <div key={fw.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        {/* Dynamic Background */}
                        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-10 transition-transform group-hover:scale-150 ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <Shield className={`h-5 w-5 ${isHealthy ? 'text-emerald-500' : 'text-amber-500'}`} />
                                <h3 className="font-bold text-slate-800">{fw.name}</h3>
                            </div>
                            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 gap-1">
                                {getTrendIcon(fw.trend)}
                            </div>
                        </div>

                        <div className="relative z-10 mt-6 flex items-end justify-between">
                            <div>
                                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {fw.overallScore}%
                                </div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
                                    Overall Score
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium text-slate-700">
                                    {fw.controlsPassed} / {fw.controlsTotal}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">Controls met</div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ease-out ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
