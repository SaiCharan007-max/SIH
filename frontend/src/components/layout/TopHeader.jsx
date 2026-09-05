import React from 'react';
import { Calendar, RefreshCw, ShieldAlert, User, MapPin } from 'lucide-react';
import { Badge } from '../common/Badge';

export const TopHeader = ({
  planDate = '2026-09-10',
  currentRun,
  onRefresh,
  loading = false,
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/75 backdrop-blur-md px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Context & Date */}
      <div className="flex items-center gap-3 md:gap-5 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold text-slate-100">Northern Railway</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Delhi Division</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Plan Date: {planDate}</span>
        </div>

        {currentRun && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Plan:</span>
            <span className="font-mono font-semibold text-slate-200">
              {currentRun.run_code || currentRun.id?.slice(0, 8)}
            </span>
            <Badge variant="proposed" size="xs">
              {currentRun.status || 'PROPOSED'}
            </Badge>
          </div>
        )}
      </div>

      {/* Safety Banner & User Info */}
      <div className="flex items-center gap-3">
        {/* Prominent Operational Review Banner */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>AI-generated proposal · Requires operational review</span>
        </div>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
            title="Refresh operational planning data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        {/* User / Demo Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-none">C. C. Track</div>
            <div className="text-[10px] text-slate-400 leading-tight">Chief Controller</div>
          </div>
        </div>
      </div>
    </header>
  );
};
