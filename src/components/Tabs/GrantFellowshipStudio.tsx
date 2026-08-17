import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  Share2,
  Calculator,
  FileText,
  Clock,
  Sparkles,
  Search,
  Filter,
  Users,
  Building,
  Check,
  X,
  ExternalLink,
  Zap,
  TrendingUp,
  ShieldCheck,
  Globe,
  PieChart
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { EmptyState } from '../ui/states';

export default function GrantFellowshipStudio() {
  const { user, profile } = useAppContext();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'directory' | 'proposal' | 'budget' | 'mentors' | 'export'>('directory');
  const [notification, setNotification] = useState<{ type: string; message: string }>({ type: '', message: '' });

  // Grant Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Grants Database
  const [grants, setGrants] = useState([
    {
      id: 'g_1',
      title: 'Google Open Source Research Grant',
      sponsor: 'Google Research',
      amount: '$10,000 USD',
      deadline: '2026-08-30',
      category: 'open_source',
      eligibilityMatch: 95,
      description: 'Funding for undergraduate & graduate students building open-source developer tooling and ML infrastructure.',
      applied: false,
      apply_link: 'https://research.google/outreach/research-scholar-program/'
    },
    {
      id: 'g_2',
      title: 'Ethereum Foundation Ecosystem Grant',
      sponsor: 'Ethereum Foundation',
      amount: '$15,000 USD',
      deadline: '2026-09-15',
      category: 'web3',
      eligibilityMatch: 88,
      description: 'Supports research on zero-knowledge cryptography, Layer-2 scalability, and decentralized identity.',
      applied: true,
      apply_link: 'https://esp.ethereum.foundation'
    },
    {
      id: 'g_3',
      title: 'AWS Cloud Credits for Student Startups',
      sponsor: 'Amazon Web Services',
      amount: '$5,000 Credits',
      deadline: '2026-10-01',
      category: 'cloud',
      eligibilityMatch: 90,
      description: 'Cloud infrastructure credits for early-stage student founder projects and AI model hosting.',
      applied: false,
      apply_link: 'https://aws.amazon.com/activate/'
    }
  ]);

  // Proposal Draft State
  const [proposalData, setProposalData] = useState({
    title: 'Distributed Vector Database Optimization for Edge Devices',
    abstract: 'This project aims to optimize memory-efficient vector indexing algorithms for low-power mobile devices.',
    targetGrant: 'Google Open Source Research Grant',
    deliverables: 'Open-source Python library, 2 research papers, benchmark suite.',
    timelineMonths: 6,
    requestedAmount: 8500
  });

  // Budget Breakdown State
  const [budgetItems, setBudgetItems] = useState([
    { id: 'b_1', item: 'GPU Cloud Compute (Nvidia A100)', cost: 3500, category: 'Compute' },
    { id: 'b_2', item: 'Hardware Test Devices & Microcontrollers', cost: 2000, category: 'Hardware' },
    { id: 'b_3', item: 'Open Source Conference Travel Stipend', cost: 1500, category: 'Travel' },
    { id: 'b_4', item: 'Domain & SSL Security Infrastructure', cost: 500, category: 'Hosting' }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');

  // Mentor Endorsements State
  const [mentors, setMentors] = useState([
    { id: 'm_1', name: 'Dr. Ramesh Kumar', title: 'Professor of CS, IIT Delhi', status: 'ENDORSED', date: '2026-07-15' },
    { id: 'm_2', name: 'Sarah Jenkins', title: 'Senior Staff Engineer, Google AI', status: 'PENDING', date: '2026-07-20' }
  ]);
  const [newMentorName, setNewMentorName] = useState('');

  // Total Budget Calculator
  const totalBudget = useMemo(() => {
    return budgetItems.reduce((acc, curr) => acc + curr.cost, 0);
  }, [budgetItems]);

  // Readiness Score
  const readinessScore = useMemo(() => {
    let score = 30;
    if (proposalData.title.length > 10) score += 20;
    if (proposalData.abstract.length > 30) score += 20;
    if (budgetItems.length >= 2) score += 15;
    if (mentors.some(m => m.status === 'ENDORSED')) score += 15;
    return Math.min(score, 100);
  }, [proposalData, budgetItems, mentors]);

  // Add Budget Item
  const handleAddBudgetItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCost || isNaN(Number(newItemCost))) return;

    const newItem = {
      id: `b_${Date.now()}`,
      item: newItemName.trim(),
      cost: Number(newItemCost),
      category: 'General'
    };

    setBudgetItems([...budgetItems, newItem]);
    setNewItemName('');
    setNewItemCost('');
    setNotification({ type: 'success', message: 'Added budget allocation item!' });
  };

  // Remove Budget Item
  const handleRemoveBudgetItem = (id: string) => {
    setBudgetItems(budgetItems.filter(b => b.id !== id));
  };

  // Add Mentor Request
  const handleAddMentorRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMentorName.trim()) return;

    const newM = {
      id: `m_${Date.now()}`,
      name: newMentorName.trim(),
      title: 'Advisor / Researcher',
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0]
    };

    setMentors([...mentors, newM]);
    setNewMentorName('');
    setNotification({ type: 'success', message: `Requested recommendation from ${newM.name}!` });
  };

  // Export Proposal Manifest JSON
  const handleExportProposal = () => {
    const manifest = {
      proposal: proposalData,
      totalRequestedBudget: `$${totalBudget} USD`,
      budgetBreakdown: budgetItems,
      endorsements: mentors,
      readinessScore: `${readinessScore}%`,
      timestamp: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifest, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `YuvaHub_Grant_Proposal_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  // Filtered Grants
  const filteredGrants = grants.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.sponsor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || g.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 font-sans pb-16 px-2 sm:px-4">
      
      {/* Top Banner Header - Brand Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#f6efe2] via-[#fcf9f2] to-[#f6efe2] dark:from-slate-900 dark:to-slate-950 border border-[#e8ded1] dark:border-slate-800 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#f3e4bd] bg-[#603620] rounded-full flex items-center gap-1.5 shadow-xs">
                <DollarSign className="w-3.5 h-3.5 text-[#f3e4bd]" /> Student Fellowship Vault
              </span>
              <span className="px-3 py-1 text-xs font-bold text-[#63703d] bg-[#63703d]/15 border border-[#63703d]/30 rounded-full">
                2026 Grants Active
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#231f20] dark:text-white tracking-tight">
              Grants & <span className="text-[#b56b37] italic">Fellowships Studio</span>
            </h1>
            <p className="text-[#603620] dark:text-slate-400 text-xs md:text-sm max-w-2xl font-medium">
              Explore verified research grants, build interactive budget proposals, request mentor endorsements, and export JSON proposal manifests.
            </p>
          </div>

          {/* Proposal Readiness Meter */}
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 p-4 rounded-2xl w-full lg:w-auto shadow-xs">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-4 border-[#b56b37] bg-[#fcf9f2] font-serif font-bold text-lg text-[#b56b37]">
              {readinessScore}%
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#8c7569] tracking-wider">Readiness Index</div>
              <div className="text-xs font-extrabold text-[#231f20] dark:text-white">${totalBudget} Budgeted</div>
              <div className="text-[11px] text-[#63703d] font-semibold">{mentors.filter(m => m.status === 'ENDORSED').length} Mentor Endorsements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[#e8ded1] dark:border-slate-800 pb-3">
        {[
          { id: 'directory', label: 'Grant Directory', icon: Globe },
          { id: 'proposal', label: 'Proposal Builder', icon: FileText },
          { id: 'budget', label: 'Budget Allocator', icon: Calculator },
          { id: 'mentors', label: 'Mentor Endorsements', icon: Users },
          { id: 'export', label: 'Export Manifest', icon: Download }
        ].map(tab => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-[#b56b37] border-[#b56b37] text-white shadow-sm scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 border-[#e8ded1] dark:border-slate-800 text-[#603620] dark:text-slate-300 hover:bg-[#f6efe2]'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#b56b37]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notification Banner */}
      {notification.message && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#63703d]/15 border border-[#63703d]/30 text-[#63703d] text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification({ type: '', message: '' })} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 1: Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 p-4 rounded-2xl shadow-2xs">
            <div className="relative flex-1 w-full sm:w-auto max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7569]" />
              <input
                type="text"
                placeholder="Search grants by name or sponsor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#fcf9f2] dark:bg-slate-800 border border-[#e8ded1] dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#231f20] dark:text-white outline-none focus:border-[#b56b37]"
              />
            </div>

            <div className="flex items-center gap-2">
              {['all', 'open_source', 'web3', 'cloud'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                    selectedCategory === cat
                      ? 'bg-[#231f20] text-white border-[#231f20]'
                      : 'bg-white border-[#e8ded1] text-[#603620] hover:bg-[#f6efe2]'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGrants.map(grant => (
              <div key={grant.id} className="bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4 hover:border-[#b56b37] transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-[#8c7569] uppercase tracking-wider block">{grant.sponsor}</span>
                    <h3 className="font-serif font-bold text-base text-[#231f20] dark:text-white mt-1 leading-snug">{grant.title}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[#63703d]/15 text-[#63703d] font-bold text-xs border border-[#63703d]/30">
                    {grant.eligibilityMatch}% Match
                  </span>
                </div>

                <p className="text-xs text-[#603620] dark:text-slate-300 leading-relaxed font-medium line-clamp-3">
                  {grant.description}
                </p>

                <div className="pt-3 border-t border-[#e8ded1] dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <div className="text-[#b56b37]">{grant.amount}</div>
                  <a
                    href={grant.apply_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#b56b37] hover:underline"
                  >
                    <span>Apply Grant</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Proposal Builder */}
      {activeTab === 'proposal' && (
        <div className="bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="border-b border-[#e8ded1] dark:border-slate-800 pb-4">
            <h2 className="text-xl font-serif font-bold text-[#231f20] dark:text-white">Research Proposal Draft</h2>
            <p className="text-xs text-[#603620] dark:text-slate-400 font-medium">Define your project scope, targets, and expected research deliverables.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#603620] uppercase tracking-wider">Project Title</label>
              <input
                type="text"
                value={proposalData.title}
                onChange={e => setProposalData({ ...proposalData, title: e.target.value })}
                className="w-full bg-[#fcf9f2] dark:bg-slate-800 border border-[#e8ded1] dark:border-slate-700 rounded-xl p-3 text-xs text-[#231f20] dark:text-white outline-none focus:border-[#b56b37]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#603620] uppercase tracking-wider">Abstract / Project Summary</label>
              <textarea
                rows={4}
                value={proposalData.abstract}
                onChange={e => setProposalData({ ...proposalData, abstract: e.target.value })}
                className="w-full bg-[#fcf9f2] dark:bg-slate-800 border border-[#e8ded1] dark:border-slate-700 rounded-xl p-3 text-xs text-[#231f20] dark:text-white outline-none focus:border-[#b56b37] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-[#603620] uppercase tracking-wider">Expected Deliverables</label>
                <input
                  type="text"
                  value={proposalData.deliverables}
                  onChange={e => setProposalData({ ...proposalData, deliverables: e.target.value })}
                  className="w-full bg-[#fcf9f2] dark:bg-slate-800 border border-[#e8ded1] dark:border-slate-700 rounded-xl p-3 text-xs text-[#231f20] dark:text-white outline-none focus:border-[#b56b37]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#603620] uppercase tracking-wider">Timeline (Months)</label>
                <input
                  type="number"
                  value={proposalData.timelineMonths}
                  onChange={e => setProposalData({ ...proposalData, timelineMonths: Number(e.target.value) })}
                  className="w-full bg-[#fcf9f2] dark:bg-slate-800 border border-[#e8ded1] dark:border-slate-700 rounded-xl p-3 text-xs text-[#231f20] dark:text-white outline-none focus:border-[#b56b37]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Budget Allocator */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xs">
            <div className="flex justify-between items-center border-b border-[#e8ded1] dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#231f20] dark:text-white">Grant Budget Calculator</h2>
                <p className="text-xs text-[#603620] dark:text-slate-400 font-medium">Itemize compute, hardware, and travel expenses.</p>
              </div>
              <div className="text-lg font-bold text-[#b56b37]">
                Total: ${totalBudget} USD
              </div>
            </div>

            <form onSubmit={handleAddBudgetItem} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Item description (e.g. GPU compute)"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                className="bg-[#fcf9f2] border border-[#e8ded1] rounded-xl p-2.5 text-xs text-[#231f20] outline-none"
              />
              <input
                type="number"
                placeholder="Cost in USD ($)"
                value={newItemCost}
                onChange={e => setNewItemCost(e.target.value)}
                className="bg-[#fcf9f2] border border-[#e8ded1] rounded-xl p-2.5 text-xs text-[#231f20] outline-none"
              />
              <button
                type="submit"
                className="bg-[#b56b37] hover:bg-[#96552a] text-white font-bold text-xs rounded-xl p-2.5 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {budgetItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-[#fcf9f2] border border-[#e8ded1] text-xs">
                  <div>
                    <span className="font-bold text-[#231f20]">{item.item}</span>
                    <span className="text-[10px] text-[#8c7569] block font-semibold">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#63703d]">${item.cost}</span>
                    <button onClick={() => handleRemoveBudgetItem(item.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Mentors */}
      {activeTab === 'mentors' && (
        <div className="bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="border-b border-[#e8ded1] dark:border-slate-800 pb-4">
            <h2 className="text-xl font-serif font-bold text-[#231f20] dark:text-white">Mentor Recommendation Ledger</h2>
            <p className="text-xs text-[#603620] dark:text-slate-400 font-medium">Request and track academic & industry endorsements for grant applications.</p>
          </div>

          <form onSubmit={handleAddMentorRequest} className="flex gap-3">
            <input
              type="text"
              placeholder="Mentor or Professor Name"
              value={newMentorName}
              onChange={e => setNewMentorName(e.target.value)}
              className="flex-1 bg-[#fcf9f2] border border-[#e8ded1] rounded-xl p-2.5 text-xs text-[#231f20] outline-none"
            />
            <button type="submit" className="bg-[#b56b37] hover:bg-[#96552a] text-white font-bold text-xs rounded-xl px-5 py-2.5 flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Request Endorsement
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {mentors.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#fcf9f2] border border-[#e8ded1] text-xs">
                <div>
                  <h4 className="font-bold text-[#231f20]">{m.name}</h4>
                  <p className="text-[11px] text-[#603620] font-medium">{m.title}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                  m.status === 'ENDORSED' ? 'bg-[#63703d]/15 text-[#63703d] border border-[#63703d]/30' : 'bg-[#f3e4bd] text-[#231f20] border border-[#e8ded1]'
                }`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Export */}
      {activeTab === 'export' && (
        <div className="bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xs">
          <div className="w-16 h-16 bg-[#f6efe2] text-[#b56b37] flex items-center justify-center rounded-full mx-auto border border-[#e8ded1]">
            <Download className="w-8 h-8 text-[#b56b37]" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#231f20] dark:text-white">Export Proposal Manifest</h2>
          <p className="text-xs text-[#603620] dark:text-slate-400 font-medium max-w-md mx-auto">
            Compile your proposal abstract, itemized budget (${totalBudget}), and mentor endorsements into a standardized JSON manifest.
          </p>
          <button
            onClick={handleExportProposal}
            className="px-6 py-3 bg-[#b56b37] hover:bg-[#96552a] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Proposal JSON Manifest
          </button>
        </div>
      )}
    </div>
  );
}
