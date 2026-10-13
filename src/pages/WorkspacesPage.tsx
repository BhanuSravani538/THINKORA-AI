import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Sliders,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkspacesPageProps {
  onOpenCreateWorkspace: () => void;
}

export const WorkspacesPage: React.FC<WorkspacesPageProps> = ({ onOpenCreateWorkspace }) => {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const navigate = useNavigate();


  const domains = useMemo(() => {
    const list = Array.from(new Set(workspaces.map(w => w.domain)));
    return ['All', ...list];
  }, [workspaces]);

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(w => {
      const matchSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDomain = selectedDomain === 'All' || w.domain === selectedDomain;
      const matchStatus = selectedStatus === 'All' || w.status === selectedStatus;

      return matchSearch && matchDomain && matchStatus;
    });
  }, [workspaces, searchQuery, selectedDomain, selectedStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'decision_ready':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Decision Ready
          </span>
        );
      case 'simulated':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Simulated
          </span>
        );
      case 'in_review':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> In Review
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Active
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-blue-400" /> Research Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage evidence synthesis studies, decision models, and stakeholder evaluations.
          </p>
        </div>
        <button
          onClick={onOpenCreateWorkspace}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search workspaces by name, tag, or keyword..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {domains.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="decision_ready">Decision Ready</option>
            <option value="simulated">Simulated</option>
            <option value="in_review">In Review</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredWorkspaces.map(ws => {
          const isActive = ws.id === activeWorkspaceId;

          return (
            <div
              key={ws.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-blue-950/20 to-slate-900/80 border-blue-500/40 shadow-xl shadow-blue-500/5'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                      {ws.domain}
                    </span>
                    <h2 className="text-base font-bold text-white leading-snug">{ws.name}</h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-blue-300 border border-slate-700"
                      title="Confidence Rating"
                    >
                      Grade {ws.confidenceGrade}
                    </span>
                    {getStatusBadge(ws.status)}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {ws.description}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                  <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    <span className="font-semibold text-slate-200">Goal: </span>
                    {ws.decisionGoal}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {ws.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-slate-800/70 text-slate-400 text-[10px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Completeness Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px]">Evidence Completeness</span>
                    <span className="font-semibold text-emerald-400">{ws.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full"
                      style={{ width: `${ws.completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-500" /> {ws.documentsCount} docs
                  </span>
                  <span>•</span>
                  <span>{ws.claimsCount} claims</span>
                  <span>•</span>
                  <span className={ws.contradictionsCount > 0 ? 'text-amber-400 font-semibold' : ''}>
                    {ws.contradictionsCount} conflicts
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {isActive ? (
                    <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-semibold text-xs border border-blue-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Active Workspace
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveWorkspaceId(ws.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveWorkspaceId(ws.id);
                      navigate('/simulator');
                    }}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    title="Simulate Decision"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
