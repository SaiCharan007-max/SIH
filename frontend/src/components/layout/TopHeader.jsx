import React from 'react';
import { Calendar, RefreshCw, ShieldAlert, User, MapPin } from 'lucide-react';

export const TopHeader = ({
  planDate = '2026-09-10',
  currentRun,
  onRefresh,
  loading = false,
}) => {
  return (
    <header className="h-14 border-b border-slate-850 bg-slate-950/90 backdrop-blur-sm px-6 flex items-center justify-between gap-4 sticky top-0 z-20 select-none">
      {/* Location, Date & Active Plan Context */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold text-slate-100">Northern Railway</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Delhi Division</span>
        </div>

        <span className="text-slate-700 hidden sm:inline">|</span>

        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>{planDate}</span>
        </div>

        {currentRun && (
          <>
            <span className="text-slate-700 hidden md:inline">|</span>
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-mono text-[11px]">Plan:</span>
              <span className="font-mono font-medium text-slate-200">
                {currentRun.run_code || currentRun.id?.slice(0, 8)}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                {currentRun.status || 'PROPOSED'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Safety Notice & Operator Actions */}
      <div className="flex items-center gap-3">
        {/* Safety Review Notice */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>AI-generated proposal · Requires operational review</span>
        </div>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh operational data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        )}

        {/* User / Controller Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-300">
          <div className="w-6 h-6 rounded bg-slate-850 flex items-center justify-center text-slate-400">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="hidden xl:block text-left leading-tight">
            <div className="text-[11px] font-medium text-slate-200">Chief Controller</div>
            <div className="text-[9px] text-slate-500 font-mono">Track Possession</div>
          </div>
        </div>
      </div>
    </header>
  );
};
