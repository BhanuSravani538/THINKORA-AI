import React, { useState, useRef } from 'react';
import {
  Search,
  Bell,
  Network,
  ChevronDown,
  Sparkles,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenCreateWorkspace?: () => void;
  onOpenUploadDoc?: () => void;
  onFileSelect?: (file: File | null, error?: string | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateWorkspace,
  onOpenUploadDoc,
  onFileSelect,
}) => {
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    activities,
    globalSearch,
    setGlobalSearch,
  } = useWorkspace();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      // User cancelled picker dialog - gracefully return without side-effects
      return;
    }
    const file = files[0];
    // Reset file input so selecting the same file again triggers change
    e.target.value = '';

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      if (onFileSelect) {
        onFileSelect(null, `Unsupported file format "${file.name.split('.').pop()}". Only PDF documents (.pdf) are supported.`);
      } else if (onOpenUploadDoc) {
        onOpenUploadDoc();
      }
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      if (onFileSelect) {
        onFileSelect(null, `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 50 MB limit.`);
      } else if (onOpenUploadDoc) {
        onOpenUploadDoc();
      }
      return;
    }

    if (onFileSelect) {
      onFileSelect(file, null);
    } else if (onOpenUploadDoc) {
      onOpenUploadDoc();
    }
  };

  const unreadCount = activities.filter(a => a.severity === 'alert' || a.severity === 'warning').length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Brand & Workspace Switcher */}
      <div className="flex items-center gap-4 lg:gap-6 min-w-0">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Network className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5 font-mono">
                THINKORA
              </span>
            </div>
            <p className="text-[9px] text-blue-400/90 hidden sm:block tracking-wider font-semibold uppercase">
              AI-Powered Research Intelligence
            </p>
          </div>
        </Link>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-800 hidden md:block" />

        {/* Workspace Dropdown */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-left transition-colors max-w-[280px] lg:max-w-[340px]"
            title="Switch Workspace"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                <span>{activeWorkspace.name}</span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span>{activeWorkspace.domain}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Grade {activeWorkspace.confidenceGrade}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
          </button>

          {/* Workspace Menu Dropdown */}
          {workspaceMenuOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setWorkspaceMenuOpen(false)}
            >
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80 mb-1">
                <span>Research Workspaces</span>
                {onOpenCreateWorkspace && (
                  <button
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      onOpenCreateWorkspace();
                    }}
                    className="text-blue-400 hover:text-blue-300 text-[11px] font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1 py-1">
                {workspaces.map(ws => {
                  const isActive = ws.id === activeWorkspace.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        setWorkspaceMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${
                        isActive
                          ? 'bg-blue-600/15 border border-blue-500/30 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          ws.status === 'decision_ready'
                            ? 'bg-emerald-400'
                            : ws.status === 'simulated'
                            ? 'bg-blue-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-slate-200 truncate flex items-center justify-between">
                          <span className="truncate">{ws.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-blue-300 ml-1">
                            {ws.confidenceGrade}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {ws.domain} • {ws.documentsCount} docs • {ws.contradictionsCount} contradictions
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Quick Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Search claims, documents, contradictions, or metrics..."
            className="w-full bg-slate-900/90 border border-slate-800/90 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Simulator Launch Button */}
        <button
          onClick={() => navigate('/simulator')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Simulate</span>
        </button>

        {/* Document upload trigger connected to native PDF file picker */}
        {(onFileSelect || onOpenUploadDoc) && (
          <>
            <input
              ref={fileInputRef}
              id="navbar-file-input"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              aria-label="Upload PDF Evidence Document"
              tabIndex={-1}
              onChange={handleFileInputChange}
            />
            <button
              id="navbar-upload-button"
              type="button"
              onClick={handleUploadButtonClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              title="Upload PDF evidence document"
              aria-label="Upload Evidence Document"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Upload</span>
            </button>
          </>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Activity Feed & Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setNotificationsOpen(false)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Recent Intelligence Activity
                </span>
                <span className="text-[10px] text-slate-400">{activities.length} events logged</span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {activities.slice(0, 6).map(act => (
                  <div
                    key={act.id}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs flex items-start gap-2.5"
                  >
                    {act.severity === 'alert' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : act.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-200 text-[11px] truncate">{act.title}</div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{act.description}</p>
                      <div className="text-[9px] text-slate-500 mt-1">{act.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-blue-500/30">
            ER
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-200">Dr. E. Rostova</div>
            <div className="text-[10px] text-blue-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Lead Architect
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
