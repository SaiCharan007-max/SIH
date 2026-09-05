import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { getPlanningRuns, comparePlanningRuns } from '../services/api';
import { formatTime } from '../utils/timeUtils';
import {
  GitCompare,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  RefreshCw,
  MoveHorizontal,
  PlusCircle,
  MinusCircle,
  FileDiff,
} from 'lucide-react';

export const PlanComparison = ({ planDate = '2026-09-10' }) => {
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  const [runs, setRuns] = useState([]);
  const [oldRunId, setOldRunId] = useState('');
  const [newRunId, setNewRunId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);

  // Load available runs
  useEffect(() => {
    const fetchRuns = async () => {
      try {
        setLoading(true);
        setError(null);
        const runsList = await getPlanningRuns({ plan_date: planDate });
        setRuns(runsList || []);

        if (runsList && runsList.length >= 2) {
          // Default: Old Plan = run 1, New Plan = run 0
          setOldRunId(runsList[1].id);
          setNewRunId(runsList[0].id);
        } else if (runsList && runsList.length === 1) {
          setOldRunId(runsList[0].id);
          setNewRunId(runsList[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch planning runs');
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, [planDate]);

  // Execute diff comparison
  const handleCompare = async () => {
    if (!oldRunId || !newRunId) return;
    try {
      setComparing(true);
      setError(null);
      const diff = await comparePlanningRuns(oldRunId, newRunId);
      setComparisonData(diff);
    } catch (err) {
      setError(err.message || 'Comparison failed between selected runs');
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    if (oldRunId && newRunId && oldRunId !== newRunId) {
      handleCompare();
    }
  }, [oldRunId, newRunId]);

  const summary = comparisonData?.summary || {};
  const changes = comparisonData?.changes || [];

  const oldRun = runs.find((r) => r.id === oldRunId);
  const newRun = runs.find((r) => r.id === newRunId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-amber-400" />
            Plan Comparison
          </h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Change Management
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Audit schedule shifts, preserved invariants, and revised block windows across optimization runs
        </p>
      </div>

      {/* Plan Selector Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Old Plan Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Old Plan
            </label>
            <select
              value={oldRunId}
              onChange={(e) => setOldRunId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.run_code} ({r.run_type || 'PLAN'}) &mdash; {r.status || 'PROPOSED'}
                </option>
              ))}
            </select>
          </div>

          <div className="self-end pb-2.5 text-slate-500 hidden sm:block">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* New Plan Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              New Plan
            </label>
            <select
              value={newRunId}
              onChange={(e) => setNewRunId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.run_code} ({r.run_type || 'REPLAN'}) &mdash; {r.status || 'PROPOSED'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={comparing || !oldRunId || !newRunId}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all self-end cursor-pointer"
        >
          {comparing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileDiff className="w-3.5 h-3.5" />
          )}
          <span>Audit Differences</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Strip */}
      {comparisonData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Jobs Moved */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Jobs moved</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {summary.jobs_moved ?? 0}
            </div>
            <span className="text-[10px] text-amber-500/80 mt-0.5 block flex items-center gap-1">
              <MoveHorizontal className="w-3 h-3" /> Rescheduled
            </span>
          </div>

          {/* Jobs Unchanged */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Jobs unchanged</span>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">
              {summary.jobs_unchanged ?? 0}
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Frozen & Invariant
            </span>
          </div>

          {/* Jobs Newly Scheduled */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Jobs newly scheduled</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {summary.jobs_newly_scheduled ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block flex items-center gap-1">
              <PlusCircle className="w-3 h-3 text-emerald-400" /> Newly accommodated
            </span>
          </div>

          {/* Jobs Unscheduled */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Jobs unscheduled</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              {summary.jobs_unscheduled ?? 0}
            </div>
            <span className="text-[10px] text-rose-500/80 mt-0.5 block flex items-center gap-1">
              <MinusCircle className="w-3 h-3 text-rose-400" /> Dropped / Clashed
            </span>
          </div>

          {/* Blocks Changed */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Blocks changed</span>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {summary.blocks_changed ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {summary.blocks_unchanged ?? 0} intact blocks
            </span>
          </div>
        </div>
      )}

      {/* Comparison Timeline & Job Shift Audit List */}
      <Card
        title="Schedule Comparison Timeline & Invariants"
        subtitle={`Comparing ${oldRun?.run_code || 'Old Plan'} against ${newRun?.run_code || 'New Plan'}`}
      >
        {!comparisonData || changes.length === 0 ? (
          <EmptyState
            icon={GitCompare}
            title="No Comparison Generated"
            description="Select two planning runs above to view an instant itemized audit of schedule invariance, moved jobs, and block shifts."
          />
        ) : (
          <div className="space-y-3">
            {changes.map((c) => {
              const isMoved = c.change === 'MOVED';
              const isUnchanged = c.change === 'UNCHANGED';
              const isNew = c.change === 'NEWLY_SCHEDULED' || c.change === 'NEW';
              const isUnscheduled = c.change === 'UNSCHEDULED';

              return (
                <div
                  key={c.job_id || c.job_code}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isMoved
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : isNew
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : isUnscheduled
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                    {/* Job Identity & Status Badge */}
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-slate-100">
                        {c.job_code || c.job_id?.slice(0, 8)}
                      </span>

                      {isMoved && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[10px]">
                          MOVED
                        </span>
                      )}

                      {isUnchanged && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium text-[10px]">
                          UNCHANGED
                        </span>
                      )}

                      {isNew && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                          NEW
                        </span>
                      )}

                      {isUnscheduled && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                          UNSCHEDULED
                        </span>
                      )}
                    </div>

                    {/* Timeline Transition Display */}
                    <div className="flex items-center gap-3">
                      {isMoved ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">
                            {c.old_start ? `${formatTime(c.old_start)} → ${formatTime(c.old_end)}` : '--:--'}
                          </span>
                          <span className="text-amber-400 font-bold">↓</span>
                          <span className="text-amber-300 font-bold">
                            {c.new_start ? `${formatTime(c.new_start)} → ${formatTime(c.new_end)}` : '--:--'}
                          </span>
                        </div>
                      ) : isUnchanged ? (
                        <div className="text-slate-400">
                          {c.old_start ? `${formatTime(c.old_start)} → ${formatTime(c.old_end)}` : '--:--'}
                          <span className="ml-2 text-emerald-400 text-[10px] font-medium">(Preserved)</span>
                        </div>
                      ) : isNew ? (
                        <div className="text-emerald-400 font-bold">
                          {c.new_start ? `${formatTime(c.new_start)} → ${formatTime(c.new_end)}` : '--:--'}
                        </div>
                      ) : (
                        <div className="text-rose-400">
                          Previously: {c.old_start ? `${formatTime(c.old_start)} → ${formatTime(c.old_end)}` : '--:--'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
