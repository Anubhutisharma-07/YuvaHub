import React, { useState, useEffect } from 'react';
import { EnterpriseBillingOverview, InvoiceRecord, PaymentMethod } from '../../types/billing';
import { BillingService } from '../../services/BillingService';
import { CostAnalyticsCard } from '../../components/Enterprise/CostAnalyticsCard';
import { InvoiceTimeline } from '../../components/Enterprise/InvoiceTimeline';
import {
    Building2, CreditCard, Wallet, AlertCircle,
    ArrowUpRight, ArrowDownRight, Settings, UploadCloud
} from 'lucide-react';

export const BillingPlatform: React.FC = () => {
    const [overview, setOverview] = useState<EnterpriseBillingOverview | null>(null);
    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [totalInvoices, setTotalInvoices] = useState(0);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);

    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingInvoices, setLoadingInvoices] = useState(true);

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeTarget, setUpgradeTarget] = useState('CUSTOM_USAGE');

    useEffect(() => {
        const fetchCore = async () => {
            setLoadingOverview(true);
            const [ovw, pay] = await Promise.all([
                BillingService.getBillingOverview(),
                BillingService.getPaymentMethods()
            ]);
            setOverview(ovw);
            setMethods(pay);
            setLoadingOverview(false);
        };
        fetchCore();
    }, []);

    useEffect(() => {
        fetchInvoices(0);
    }, []);

    const fetchInvoices = async (offset: number) => {
        setLoadingInvoices(true);
        const { data, total } = await BillingService.getInvoices('ALL', 10, offset);
        setInvoices(data);
        setTotalInvoices(total);
        setLoadingInvoices(false);
    };

    const handleUpgradeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await BillingService.requestSubscriptionUpgrade(upgradeTarget);
        setIsUpgradeModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-4 lg:p-8 font-sans">
            <div className="max-w-[1400px] mx-auto space-y-8">

                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Billing & Cost Management</h1>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <span className="font-semibold uppercase text-xs tracking-wider text-slate-500">Plan:</span>
                                <span className="font-bold text-indigo-700">{overview?.currentTier || 'LOADING...'}</span>
                            </div>
                            {overview && overview.outstandingBalance > 0 && (
                                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="font-bold">Outstanding Balance: ${overview.outstandingBalance.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <button className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 outline-none flex items-center justify-center gap-2">
                            <Settings className="h-4 w-4" /> Settings
                        </button>
                        <button
                            onClick={() => setIsUpgradeModalOpen(true)}
                            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 border border-transparent text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 transition-all focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 outline-none flex items-center justify-center gap-2"
                        >
                            <UploadCloud className="h-4 w-4" /> Switch Plan
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <CostAnalyticsCard
                            metrics={overview ? overview.costMetrics : []}
                            isLoading={loadingOverview}
                        />

                        <InvoiceTimeline
                            invoices={invoices}
                            isLoading={loadingInvoices}
                            totalRecords={totalInvoices}
                            onPageChange={fetchInvoices}
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-indigo-600" /> Executive Summary
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Current Monthly Run Rate</p>
                                    <p className="text-4xl font-extrabold text-slate-900">
                                        ${loadingOverview ? '---' : overview?.totalMonthlySpend.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-2 text-sm text-emerald-600 font-semibold">
                                        <ArrowDownRight className="h-4 w-4" /> -2.4% vs last month
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Next Invoice Estimate</p>
                                    <p className="text-2xl font-bold text-slate-700">
                                        ${loadingOverview ? '---' : ((overview?.totalMonthlySpend || 0) * 1.05).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                                        Expected {loadingOverview ? '...' : new Date(overview!.nextBillingDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-slate-500" /> Payment Methods
                                </h3>
                                <button className="text-sm text-indigo-600 font-semibold hover:text-indigo-800">Add New</button>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {methods.map(method => (
                                    <li key={method.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-8 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                {method.type === 'CREDIT_CARD' ? 'CARD' : 'ACH'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 tracking-tight">
                                                    •••• {method.lastFour}
                                                </p>
                                                {method.expiryMonth && (
                                                    <p className="text-xs text-slate-400 font-medium">Expires {method.expiryMonth}/{method.expiryYear}</p>
                                                )}
                                            </div>
                                        </div>
                                        {method.isDefault && (
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md">Default</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>
            </div>

            {isUpgradeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 p-8 space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 text-center">Modify Subscription Tier</h2>
                        <p className="text-slate-500 text-center text-sm leading-relaxed mb-6">
                            Switching your organization's subscription tier will prorate the current billing cycle and adjust your upcoming invoice automatically.
                        </p>

                        <form onSubmit={handleUpgradeSubmit} className="space-y-6">
                            <div className="space-y-3">
                                {['PROFESSIONAL', 'ENTERPRISE', 'CUSTOM_USAGE'].map(tier => (
                                    <label key={tier} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${upgradeTarget === tier ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <input type="radio" name="tier" value={tier} checked={upgradeTarget === tier} onChange={() => setUpgradeTarget(tier)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                                            <span className="font-bold text-slate-800">{tier.replace('_', ' ')}</span>
                                        </div>
                                        {tier === overview?.currentTier && (
                                            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase">Current</span>
                                        )}
                                    </label>
                                ))}
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsUpgradeModalOpen(false)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="w-full px-4 py-3 bg-indigo-600 border border-transparent rounded-xl font-bold text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20">
                                    Confirm Change
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPlatform;
