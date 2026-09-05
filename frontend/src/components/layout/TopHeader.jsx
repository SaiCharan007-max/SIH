import React from 'react';
import { Calendar, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export const TopHeader = ({
  planDate = '2026-09-10',
  currentRun,
  onRefresh,
  loading = false
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Date & Run Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Date: {planDate}</span>
        </div>

        {currentRun && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Run:</span>
            <span className="text-xs font-mono font-semibold text-slate-200">{currentRun.run_code || currentRun.id?.slice(0, 8)}</span>
            <Badge variant={currentRun.status?.toLowerCase() || 'proposed'} size="xs">
              {currentRun.status || 'PROPOSED'}
            </Badge>
          </div>
        )}
      </div>

      {/* Decision-Support Safety Notice & Refresh */}
      <div className="flex items-center gap-3">
        {/* Safety Alert Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>AI-generated proposal — requires operational review</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
            title="Refresh planning data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
};
