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
  ShieldAlert
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/planning', label: 'Daily Planning', icon: CalendarClock },
    { to: '/maintenance', label: 'Maintenance Jobs', icon: Wrench },
    { to: '/network', label: 'Railway Network', icon: Network },
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
            <span className="font-bold text-sm text-slate-100 tracking-tight">SIH26027</span>
            <span className="text-[10px] font-mono font-medium px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">IR</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Automatic Block Planner</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Operational Views
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
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
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
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            CP-SAT Engine
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-medium">ONLINE</span>
        </div>
        <div className="text-[11px] text-slate-500 leading-snug">
          Decision-support prototype for Indian Railways Smart Maintenance.
        </div>
      </div>
    </aside>
  );
};
