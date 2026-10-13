import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  TableProperties,
  Sliders,
  Network,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  Database,
  Activity,
  Layers,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeWorkspace, workspaces, documents } = useWorkspace();

  const navItems = [
    {
      name: 'Overview',
      path: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Workspaces',
      path: '/workspaces',
      icon: FolderKanban,
      badge: workspaces.length.toString(),
    },
    {
      name: 'Documents',
      path: '/documents',
      icon: FileText,
      badge: documents.length.toString(),
    },
    {
      name: 'Evidence Explorer',
      path: '/evidence',
      icon: TableProperties,
      badge: activeWorkspace.contradictionsCount > 0 ? `${activeWorkspace.contradictionsCount} conflicts` : null,
      badgeColor: 'amber',
    },
    {
      name: 'Decision Simulator',
      path: '/simulator',
      icon: Sliders,
      badge: 'Live',
      badgeColor: 'blue',
    },
    {
      name: 'Evidence Graph',
      path: '/graph',
      icon: Network,
      badge: 'Flow',
      badgeColor: 'purple',
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: FileBarChart,
      badge: null,
    },
  ];

  return (
    <aside
      className={`relative z-30 flex flex-col border-r border-slate-800/80 bg-slate-950/95 transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-40"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase ${collapsed ? 'hidden' : 'block'}`}>
          Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${
                        item.badgeColor === 'amber'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : item.badgeColor === 'blue'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : item.badgeColor === 'purple'
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Workspace Quick Status Pill */}
      {!collapsed && (
        <div className="p-3 mx-2 mb-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Evidence Pipeline
            </span>
            <span className="text-emerald-400 font-bold">{activeWorkspace.completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${activeWorkspace.completionPercentage}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
            <span>{activeWorkspace.claimsCount} claims validated</span>
            <span className="text-amber-400">{activeWorkspace.contradictionsCount} contradictions</span>
          </div>
        </div>
      )}

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-900 text-slate-500 bg-slate-950/60">
        {!collapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-slate-400">
                <Database className="w-3 h-3 text-cyan-400" /> Graph Engine
              </span>
              <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                ONLINE
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <Activity className="w-3 h-3 text-blue-400" />
              <span>1,420 nodes • 3,890 edges</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Graph Engine Online: 1,420 nodes">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
