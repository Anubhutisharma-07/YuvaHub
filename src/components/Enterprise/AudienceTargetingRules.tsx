import React from 'react';
import { TargetingRule, RuleOperator } from '../../types/featureFlags';
import { Target, Trash2, Plus } from 'lucide-react';

interface AudienceTargetingRulesProps {
    rules: TargetingRule[];
}

export const AudienceTargetingRules: React.FC<AudienceTargetingRulesProps> = ({ rules }) => {
    const getOperatorLabel = (op: RuleOperator) => {
        switch (op) {
            case 'EQUALS': return 'IS EXACTLY';
            case 'CONTAINS': return 'CONTAINS';
            case 'IN': return 'IS ANY OF';
            case 'NOT_IN': return 'IS NOT ANY OF';
            case 'STARTS_WITH': return 'STARTS WITH';
            default: return op;
        }
    };

    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-600" /> Audience Selection
                </h3>
                <button className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    <Plus className="h-4 w-4" /> Add Rule
                </button>
            </div>

            <div className="p-6">
                {rules.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm font-semibold text-slate-500">No specific targeting rules applied.</p>
                        <p className="text-xs text-slate-400 mt-1">This feature will apply to all users inside the % rollout group.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rules.map((rule, idx) => (
                            <div key={rule.id} className="relative group">
                                {idx > 0 && (
                                    <div className="absolute -top-4 left-6 h-4 w-px bg-slate-200">
                                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">AND</span>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 transition-colors group-hover:border-slate-300">
                                    <div className="flex-1 flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-600">IF </span>
                                        <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 shadow-sm">
                                            {rule.attribute}
                                        </span>
                                        <span className="text-xs font-black uppercase text-indigo-600 mx-1">
                                            {getOperatorLabel(rule.operator)}
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {rule.values.map(v => (
                                                <span key={v} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm">
                                                    {v}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button className="self-end sm:self-auto p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
