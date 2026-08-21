import React, { useState } from 'react';
import { SupportTicket, TicketMessage } from '../../types/incidents';
import { SupportTicketService } from '../../services/SupportTicketService';
import { X, Send, Lock, User, Bot, AlertTriangle } from 'lucide-react';

interface TicketDetailModalProps {
    ticket: SupportTicket | null;
    isOpen: boolean;
    onClose: () => void;
    onTicketUpdated: (updatedTicket: SupportTicket) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, isOpen, onClose, onTicketUpdated }) => {
    const [replyBody, setReplyBody] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen || !ticket) return null;

    const handleReply = async () => {
        if (!replyBody.trim()) return;
        setIsSending(true);
        try {
            const newMessage = await SupportTicketService.addReply(ticket.id, replyBody, isInternal);
            onTicketUpdated({
                ...ticket,
                messages: [...ticket.messages, newMessage]
            });
            setReplyBody('');
            setIsInternal(false);
        } finally {
            setIsSending(false);
        }
    };

    const renderMessageIcon = (role: TicketMessage['senderRole']) => {
        if (role === 'CUSTOMER') return <User className="h-5 w-5 text-slate-500" />;
        if (role === 'SYSTEM') return <Bot className="h-5 w-5 text-indigo-500" />;
        return <span className="h-5 w-5 text-emerald-600 font-bold flex items-center justify-center text-xs">AG</span>;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-lg text-slate-900">{ticket.title}</h2>
                            {ticket.slaBreached && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] uppercase font-bold border border-red-200">
                                    <AlertTriangle className="h-3 w-3" /> SLA Breach
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{ticket.id} • Opened by {ticket.requesterName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                    {ticket.messages.map(msg => (
                        <div key={msg.id} className={`flex gap-4 ${msg.isInternalNote ? 'opacity-90' : ''}`}>
                            <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${msg.senderRole === 'CUSTOMER' ? 'bg-slate-100 border-slate-200' :
                                    msg.senderRole === 'SYSTEM' ? 'bg-indigo-50 border-indigo-200' :
                                        'bg-emerald-50 border-emerald-200'
                                }`}>
                                {renderMessageIcon(msg.senderRole)}
                            </div>
                            <div className={`flex-1 rounded-2xl p-4 shadow-sm border ${msg.isInternalNote ? 'bg-amber-50 border-amber-200/50' : 'bg-white border-slate-100'
                                }`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        {msg.senderName}
                                        {msg.isInternalNote && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 uppercase bg-amber-100/50 px-1.5 py-0.5 rounded"><Lock className="h-3 w-3" /> Internal</span>}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-400">
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p className={`text-sm leading-relaxed ${msg.isInternalNote ? 'text-amber-900' : 'text-slate-600'}`}>
                                    {msg.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reply Box */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className={`rounded-xl border focus-within:ring-2 focus-within:ring-indigo-500 ${isInternal ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                        <textarea
                            className={`w-full p-3 resize-none outline-none text-sm font-medium ${isInternal ? 'bg-transparent placeholder-amber-700/50 text-amber-900' : 'bg-transparent text-slate-700'}`}
                            placeholder={isInternal ? "Write an internal note (customers won't see this)..." : "Write your public reply..."}
                            rows={3}
                            value={replyBody}
                            onChange={e => setReplyBody(e.target.value)}
                        />
                        <div className="flex items-center justify-between px-3 pb-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                                <input
                                    type="checkbox"
                                    className="rounded text-amber-500 focus:ring-amber-500"
                                    checked={isInternal}
                                    onChange={e => setIsInternal(e.target.checked)}
                                />
                                Internal Note
                            </label>

                            <button
                                onClick={handleReply}
                                disabled={isSending || !replyBody.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {isSending ? 'Sending...' : 'Send Reply'}
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
