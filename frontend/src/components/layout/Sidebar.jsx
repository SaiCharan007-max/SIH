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
  Activity,
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
    <aside className="w-60 bg-slate-950 border-r border-slate-850/80 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-850 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <TrainTrack className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-xs text-slate-100 tracking-tight">
            Railway Intelligence
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            SIH26027 · Operations
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-2.5 pt-1 pb-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          Command & Control
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded text-xs transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-amber-400 font-semibold border-l-2 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
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
      <div className="p-3 border-t border-slate-850 bg-slate-950 text-[10px] space-y-1.5 text-slate-500">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            System Status
          </span>
          <span className="font-mono text-emerald-400">NORMAL</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[9px] text-slate-500">
          <span>CP-SAT Engine</span>
          <span className="text-slate-400">ONLINE</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[9px] text-slate-500">
          <span>PostgreSQL DB</span>
          <span className="text-slate-400">CONNECTED</span>
        </div>
      </div>
    </aside>
  );
};
