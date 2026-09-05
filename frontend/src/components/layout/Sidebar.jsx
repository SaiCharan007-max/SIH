import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  Wrench,
  GitCompare,
  Network,
  TrainTrack,
  Cpu,
  Database,
  Activity
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench },
    { to: '/planning', label: 'Daily Planning', icon: CalendarClock },
    { to: '/network', label: 'Network', icon: Network },
    { to: '/planning/compare', label: 'Plan Comparison', icon: GitCompare },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
          <TrainTrack className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-slate-100 tracking-tight">Railway Intelligence</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">SIH26027 · Operations Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Command & Control
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            System Status
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            NORMAL
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Planning Engine
          </span>
          <span className="text-[10px] font-mono text-cyan-400">CP-SAT ONLINE</span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            Database
          </span>
          <span className="text-[10px] font-mono text-indigo-400">POSTGRESQL</span>
        </div>
      </div>
    </aside>
  );
};
