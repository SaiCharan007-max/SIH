import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { getPlanningRuns, comparePlanningRuns } from '../services/api';
import { formatTime } from '../utils/timeUtils';
import {
  GitCompare,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  TrendingDown,
  RefreshCw,
  MoveHorizontal
} from 'lucide-react';

export const PlanComparison = ({ planDate = '2026-09-10' }) => {
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  const [runs, setRuns] = useState([]);
  const [runAId, setRunAId] = useState('');
  const [runBId, setRunBId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);

  // Load available runs
  useEffect(() => {
    const fetchRuns = async () => {
      try {
        setLoading(true);
        setError(null);
        const runsList = await getPlanningRuns({ plan_date: planDate });
        setRuns(runsList);

        if (runsList.length >= 2) {
          // Set parent as Run A and newest as Run B
          setRunAId(runsList[1].id);
          setRunBId(runsList[0].id);
        } else if (runsList.length === 1) {
          setRunAId(runsList[0].id);
          setRunBId(runsList[0].id);
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
    if (!runAId || !runBId) return;
    try {
      setComparing(true);
      setError(null);
      const diff = await comparePlanningRuns(runAId, runBId);
      setComparisonData(diff);
    } catch (err) {
      setError(err.message || 'Comparison failed between selected runs');
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    if (runAId && runBId && runAId !== runBId) {
      handleCompare();
    }
  }, [runAId, runBId]);

  const summary = comparisonData?.summary || {};
  const changes = comparisonData?.changes || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-amber-400" />
          Plan Diff & Replan Comparison
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Audit shift deltas, schedule stability, and changed maintenance work orders across planning versions
        </p>
      </div>

      {/* Run Selector Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Base / Parent Run A */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Base / Historical Run (Run A)
            </label>
            <select
              value={runAId}
              onChange={(e) => setRunAId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.run_code} ({r.run_type}) &mdash; {r.status} ({r.reason?.slice(0, 30) || 'Schedule'})
                </option>
              ))}
            </select>
          </div>

          <div className="self-end pb-2.5 text-slate-500 hidden sm:block">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Revised / Child Run B */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Revised / Compared Run (Run B)
            </label>
            <select
              value={runBId}
              onChange={(e) => setRunBId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.run_code} ({r.run_type}) &mdash; {r.status} ({r.reason?.slice(0, 30) || 'Schedule'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={comparing || !runAId || !runBId}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all self-end"
        >
          {comparing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          <span>Compare Versions</span>
        </button>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Comparison Summary Grid */}
      {comparisonData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Jobs Unchanged</span>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">
              {summary.jobs_unchanged ?? 0}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Preserved
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Jobs Moved</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {summary.jobs_moved ?? 0}
            </div>
            <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1 mt-0.5">
              <MoveHorizontal className="w-3 h-3" /> Rescheduled
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Newly Scheduled</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {summary.jobs_newly_scheduled ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Newly accommodated</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Unscheduled</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              {summary.jobs_unscheduled ?? 0}
            </div>
            <span className="text-[10px] text-rose-500/80 mt-0.5 block">Dropped due to clashes</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Blocks Unchanged</span>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">
              {summary.blocks_unchanged ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Corridor intact</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Blocks Changed</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {summary.blocks_changed ?? 0}
            </div>
            <span className="text-[10px] text-amber-500/80 mt-0.5 block">Adjusted windows</span>
          </div>
        </div>
      )}

      {/* Itemized Changes Diff List */}
      <Card
        title="Schedule Invariance & Movement Audit"
        subtitle="Itemized comparison of scheduled times across both plan versions"
      >
        {!comparisonData || changes.length === 0 ? (
          <EmptyState
            icon={GitCompare}
            title="No Comparison Generated"
            description="Select two different planning runs to inspect schedule shifts, frozen invariants, and moved maintenance jobs."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Job Code</th>
                  <th className="py-2.5 px-3">Change Status</th>
                  <th className="py-2.5 px-3">Base Schedule (Run A)</th>
                  <th className="py-2.5 px-3"></th>
                  <th className="py-2.5 px-3">Revised Schedule (Run B)</th>
                  <th className="py-2.5 px-3">Shift Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {changes.map((c) => {
                  const isMoved = c.change === 'MOVED';
                  const isUnchanged = c.change === 'UNCHANGED';
                  const isNew = c.change === 'NEWLY_SCHEDULED';

                  let statusVariant = 'default';
                  if (isMoved) statusVariant = 'moved';
                  if (isUnchanged) statusVariant = 'unchanged';
                  if (isNew) statusVariant = 'newly_scheduled';

                  return (
                    <tr
                      key={c.job_id}
                      className={isMoved ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-800/40'}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-200">
                        {c.job_code || c.job_id.slice(0, 8)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={statusVariant} size="xs">
                          {c.change}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {c.old_start ? `${formatTime(c.old_start)} - ${formatTime(c.old_end)}` : '--:--'}
                      </td>
                      <td className="py-2.5 px-1 text-slate-500 text-center">
                        &rarr;
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-100">
                        {c.new_start ? `${formatTime(c.new_start)} - ${formatTime(c.new_end)}` : '--:--'}
                      </td>
                      <td className="py-2.5 px-3">
                        {isMoved ? (
                          <span className="text-amber-400 font-semibold font-mono">
                            SHIFTED
                          </span>
                        ) : isUnchanged ? (
                          <span className="text-emerald-500 font-mono">
                            0m (FROZEN)
                          </span>
                        ) : (
                          <span className="text-cyan-400 font-mono">NEW</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
