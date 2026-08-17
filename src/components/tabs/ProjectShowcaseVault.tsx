import React, { useState, useMemo } from 'react';
import {
  FolderGit2,
  Globe,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  Plus,
  Trash2,
  Download,
  Video,
  Code2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Star,
  Award,
  Share2,
  Check,
  X,
  FileCode,
  Users
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function ProjectShowcaseVault() {
  const { user, profile } = useAppContext();

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'gallery' | 'submit' | 'export'>('gallery');
  const [notification, setNotification] = useState<{ type: string; message: string }>({ type: '', message: '' });

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Showcase Projects Data State
  const [projects, setProjects] = useState([
    {
      id: 'proj_vault_1',
      title: 'YuvaHub Enterprise AI Platform',
      teamName: 'Team Antigravity',
      category: 'AI & Full Stack',
      upvotes: 342,
      views: 1850,
      hasUpvoted: true,
      repoUrl: 'https://github.com/Chirag1724/YuvaHub',
      demoUrl: 'https://yuvahub.dev',
      description: 'Unified career discovery, AI ATS optimizer, hackathon studio, and open source bounty platform.',
      tags: ['React', 'TypeScript', 'Tailwind', 'Gemini AI']
    },
    {
      id: 'proj_vault_2',
      title: 'Autonomous Multi-Agent DAG Scheduler',
      teamName: 'CronVault Labs',
      category: 'Distributed Systems',
      upvotes: 289,
      views: 1420,
      hasUpvoted: false,
      repoUrl: 'https://github.com/cronvault/dag-scheduler',
      demoUrl: 'https://cronvault.io',
      description: 'Distributed workflow engine supporting cron expressions, retry backoff, and webhook triggers.',
      tags: ['Node.js', 'PostgreSQL', 'Docker', 'Redis']
    },
    {
      id: 'proj_vault_3',
      title: 'Decentralized Zero-Knowledge Identity Protocol',
      teamName: 'ZK-Shield',
      category: 'Web3 & Security',
      upvotes: 215,
      views: 980,
      hasUpvoted: false,
      repoUrl: 'https://github.com/zk-shield/protocol',
      demoUrl: 'https://zkshield.app',
      description: 'Zero-knowledge proof credential verification for student hackathon eligibility.',
      tags: ['Solidity', 'Circom', 'TypeScript', 'Next.js']
    }
  ]);

  // Submission Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newCat, setNewCat] = useState('AI & Full Stack');
  const [newRepo, setNewRepo] = useState('');
  const [newDemo, setNewDemo] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('React, TypeScript, Node.js');

  // Toggle Upvote Counter dynamically
  const toggleUpvote = (projId: string) => {
    setProjects(projects.map(p => {
      if (p.id === projId) {
        const hasUpvoted = !p.hasUpvoted;
        const upvotes = hasUpvoted ? p.upvotes + 1 : p.upvotes - 1;
        return { ...p, hasUpvoted, upvotes };
      }
      return p;
    }));
  };

  // Submit Project Form
  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRepo.trim()) return;

    const newProject = {
      id: `proj_vault_${Date.now()}`,
      title: newTitle.trim(),
      teamName: newTeam.trim() || (profile?.name || user?.displayName || 'Student Team'),
      category: newCat,
      upvotes: 1,
      views: 12,
      hasUpvoted: true,
      repoUrl: newRepo.trim(),
      demoUrl: newDemo.trim() || newRepo.trim(),
      description: newDesc.trim() || 'Innovative student project showcased on YuvaHub Global Vault.',
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
    };

    setProjects([newProject, ...projects]);
    setNewTitle('');
    setNewTeam('');
    setNewRepo('');
    setNewDemo('');
    setNewDesc('');
    setActiveTab('gallery');
    setNotification({ type: 'success', message: 'Successfully published project to YuvaHub Showcase Vault!' });
  };

  // Export Projects Manifest JSON
  const handleExportManifest = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `YuvaHub_Project_Vault_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setNotification({ type: 'success', message: 'Exported Project Vault JSON Manifest!' });
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 font-sans pb-16 px-2 sm:px-4">
      
      {/* Top Banner Header - YuvaHub Brand Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#f6efe2] via-[#fcf9f2] to-[#f6efe2] dark:from-slate-900 dark:to-slate-950 border border-[#e8ded1] dark:border-slate-800 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#f3e4bd] bg-[#603620] rounded-full flex items-center gap-1.5 shadow-xs">
                <FolderGit2 className="w-3.5 h-3.5 text-[#f3e4bd]" /> Project Vault & Showcase
              </span>
              <span className="px-3 py-1 text-xs font-bold text-[#63703d] bg-[#63703d]/15 border border-[#63703d]/30 rounded-full">
                Verified Repositories
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#231f20] dark:text-white tracking-tight">
              Project Showcase <span className="text-[#b56b37] italic">Vault</span>
            </h1>
            <p className="text-[#603620] dark:text-slate-400 text-xs md:text-sm max-w-2xl font-medium">
              Explore global student hackathon projects, open source tools, live demo links, and peer upvotes.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 p-4 rounded-2xl w-full lg:w-auto shadow-xs">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-4 border-[#b56b37] bg-[#fcf9f2] font-serif font-bold text-base text-[#b56b37]">
              {projects.length}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#8c7569] tracking-wider">Showcased Projects</div>
              <div className="text-xs font-extrabold text-[#231f20] dark:text-white">Global Student Vault</div>
              <div className="text-[11px] text-[#63703d] font-semibold">100% Peer Reviewed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[#e8ded1] dark:border-slate-800 pb-3">
        {[
          { id: 'gallery', label: 'Project Vault Gallery', icon: FolderGit2 },
          { id: 'submit', label: 'Submit Project', icon: Plus },
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
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#63703d]/15 text-[#63703d] border border-[#63703d]/30 text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification({ type: '', message: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 1: Project Vault Gallery */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 p-4 rounded-2xl shadow-2xs">
            <div className="relative flex-1 w-full sm:w-auto max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7569]" />
              <input
                type="text"
                placeholder="Search projects by title, description, or tech tag..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#fcf9f2] dark:bg-slate-800 border border-[#e8ded1] dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#231f20] dark:text-white outline-none focus:border-[#b56b37]"
              />
            </div>

            <div className="flex items-center gap-2">
              {['all', 'AI & Full Stack', 'Distributed Systems', 'Web3 & Security'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    selectedCategory === cat
                      ? 'bg-[#231f20] text-white border-[#231f20]'
                      : 'bg-white border-[#e8ded1] text-[#603620] hover:bg-[#f6efe2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(proj => (
              <div key={proj.id} className="bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#b56b37] transition-all">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-[#8c7569] uppercase tracking-wider">{proj.teamName}</span>
                      <h3 className="font-serif font-bold text-lg text-[#231f20] dark:text-white mt-0.5">{proj.title}</h3>
                    </div>
                    <button
                      onClick={() => toggleUpvote(proj.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer border transition-all ${
                        proj.hasUpvoted
                          ? 'bg-[#b56b37] text-white border-[#b56b37]'
                          : 'bg-[#fcf9f2] text-[#603620] border-[#e8ded1] hover:border-[#b56b37]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{proj.upvotes}</span>
                    </button>
                  </div>

                  <p className="text-xs text-[#603620] dark:text-slate-400 font-medium leading-relaxed">{proj.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {proj.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-[#f6efe2] text-[#603620] border border-[#e8ded1] text-[10px] font-bold rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e8ded1] dark:border-slate-800 flex items-center justify-between gap-2">
                  <a href={proj.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#603620] hover:text-[#b56b37]">
                    <Code2 className="w-4 h-4" /> GitHub Repo
                  </a>
                  {proj.demoUrl && (
                    <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b56b37] hover:underline">
                      <Globe className="w-4 h-4" /> Live Demo <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Submit Project Form */}
      {activeTab === 'submit' && (
        <div className="bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xs max-w-2xl mx-auto">
          <div className="border-b border-[#e8ded1] dark:border-slate-800 pb-4">
            <h2 className="text-xl font-serif font-bold text-[#231f20] dark:text-white">Submit Project to Global Vault</h2>
            <p className="text-xs text-[#603620] dark:text-slate-400 font-medium mt-1">Showcase your project to peer developers, recruiters, and open-source maintainers.</p>
          </div>

          <form onSubmit={handleSubmitProject} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-[#603620] uppercase">Project Title</label>
                <input required type="text" placeholder="e.g. Distributed Task Queue" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-[#fcf9f2] border border-[#e8ded1] rounded-xl p-3 text-xs text-[#231f20] outline-none" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#603620] uppercase">Team / Author Name</label>
                <input type="text" placeholder="e.g. Team Antigravity" value={newTeam} onChange={e => setNewTeam(e.target.value)} className="w-full bg-[#fcf9f2] border border-[#e8ded1] rounded-xl p-3 text-xs text-[#231f20] outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-[#603620] uppercase">GitHub Repo URL</label>
                <input required type="url" placeholder="https://github.com/..." value={newRepo} onChange={e => setNewRepo(e.target.value)} className="w-full bg-[#fcf9f2] border border-[#e8ded1] rounded-xl p-3 text-xs text-[#231f20] outline-none" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#603620] uppercase">Live Demo URL</label>
                <input type="url" placeholder="https://myproject.dev" value={newDemo} onChange={e => setNewDemo(e.target.value)} className="w-full bg-[#fcf9f2] border border-[#e8ded1] rounded-xl p-3 text-xs text-[#231f20] outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#603620] uppercase">Project Description</label>
              <textarea rows={3} placeholder="Briefly describe what your project does and technologies used..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-[#fcf9f2] border border-[#e8ded1] rounded-xl p-3 text-xs text-[#231f20] outline-none resize-none" />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#603620] uppercase">Tech Tags (comma separated)</label>
              <input type="text" placeholder="React, TypeScript, Node.js" value={newTags} onChange={e => setNewTags(e.target.value)} className="w-full bg-[#fcf9f2] border border-[#e8ded1] rounded-xl p-3 text-xs text-[#231f20] outline-none" />
            </div>

            <button type="submit" className="w-full py-3.5 bg-[#b56b37] hover:bg-[#96552a] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Publish Project to Showcase Vault
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Export */}
      {activeTab === 'export' && (
        <div className="bg-white dark:bg-slate-900 border border-[#e8ded1] dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xs max-w-xl mx-auto">
          <div className="w-16 h-16 bg-[#f6efe2] text-[#b56b37] flex items-center justify-center rounded-full mx-auto border border-[#e8ded1]">
            <Download className="w-8 h-8 text-[#b56b37]" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#231f20] dark:text-white">Export Project Vault Manifest</h2>
          <p className="text-xs text-[#603620] dark:text-slate-400 font-medium">
            Download full global project showcase directory and upvote telemetry in JSON format.
          </p>
          <button onClick={handleExportManifest} className="px-6 py-3 bg-[#b56b37] hover:bg-[#96552a] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Project Vault JSON Manifest
          </button>
        </div>
      )}
    </div>
  );
}
