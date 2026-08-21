import React, { useState, useEffect } from 'react';
import { SupportTicket, IncidentMetrics } from '../../types/incidents';
import { SupportTicketService } from '../../services/SupportTicketService';
import { SlaMetrics } from '../../components/Enterprise/SlaMetrics';
import { TicketDetailModal } from '../../components/Enterprise/TicketDetailModal';
import { LifeBuoy, Search, Filter, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const IncidentBoard: React.FC = () => {
    const [metrics, setMetrics] = useState<IncidentMetrics | null>(null);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    useEffect(() => {
        const fetchCore = async () => {
            const data = await SupportTicketService.getMetrics();
            setMetrics(data);
        };
        fetchCore();
    }, []);

    useEffect(() => {
        const fetchTickets = async () => {
            setIsLoading(true);
            const data = await SupportTicketService.getTickets(statusFilter);
            let filtered = data;
            if (searchQuery) {
                filtered = filtered.filter(t =>
                    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.id.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            setTickets(filtered);
            setIsLoading(false);
        };

        const debounce = setTimeout(fetchTickets, 300);
        return () => clearTimeout(debounce);
    }, [statusFilter, searchQuery]);

    const handleTicketUpdate = (updated: SupportTicket) => {
        setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelectedTicket(updated);
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'LOW': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'RESOLVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CLOSED': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'NEW': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans">
            <div className="max-w-[1400px] mx-auto space-y-8">

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-indigo-100 text-indigo-800 text-xs font-black uppercase tracking-widest mb-3 border border-indigo-200">
                            <LifeBuoy className="h-3.5 w-3.5" /> Support Central
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Incident Management Board</h1>
                        <p className="text-sm text-slate-500 mt-2 max-w-xl">Respond to customer issues, manage SLA priorities, and track platform health.</p>
                    </div>

                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg">
                        Create Manual Ticket
                    </button>
                </header>

                <SlaMetrics metrics={metrics} />

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search ticket ID or subject..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Filter className="h-4 w-4 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <option value="ALL">All Tickets</option>
                                <option value="NEW">New</option>
                                <option value="OPEN">Open</option>
                                <option value="RESOLVED">Resolved</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        {isLoading ? (
                            <div className="p-12 flex justify-center">
                                <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-indigo-600 rounded-full" />
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="p-24 text-center">
                                <h3 className="text-lg font-bold text-slate-700">No tickets found</h3>
                                <p className="text-slate-500 mt-2">Adjust your search or filter settings to find tickets.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        <th className="px-6 py-4">Ticket</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Priority</th>
                                        <th className="px-6 py-4">Requester</th>
                                        <th className="px-6 py-4">Updated</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tickets.map(ticket => (
                                        <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                                        {ticket.title}
                                                        {ticket.slaBreached && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                                    </span>
                                                    <span className="text-xs text-slate-400 mt-0.5">{ticket.id} • {ticket.category}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-slate-700">{ticket.requesterName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-500">{new Date(ticket.updatedAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all">
                                                    <ArrowUpRight className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>

            <TicketDetailModal
                ticket={selectedTicket}
                isOpen={selectedTicket !== null}
                onClose={() => setSelectedTicket(null)}
                onTicketUpdated={handleTicketUpdate}
            />
        </div>
    );
};

export default IncidentBoard;
