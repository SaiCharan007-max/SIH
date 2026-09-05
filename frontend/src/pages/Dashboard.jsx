import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { PlanningPipelineBanner } from '../components/planning/PlanningPipelineBanner';
import {
  getMaintenanceJobs,
  getMaintenancePriorities,
  getPlanningRuns,
  getPlanningRun
} from '../services/api';
import {
  Wrench,
  AlertTriangle,
  CalendarCheck,
  CalendarX,
  Layers,
  Clock,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Dashboard = ({ planDate = '2026-09-10' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [runs, setRuns] = useState([]);
  const [latestRunDetails, setLatestRunDetails] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobsData, prioritiesData, runsData] = await Promise.all([
        getMaintenanceJobs(),
        getMaintenancePriorities({ reference_date: planDate }),
        getPlanningRuns({ plan_date: planDate })
      ]);

      setJobs(jobsData);
      setPriorities(prioritiesData);
      setRuns(runsData);

      if (runsData.length > 0) {
        const details = await getPlanningRun(runsData[0].id);
        setLatestRunDetails(details);
      } else {
        setLatestRunDetails(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [planDate]);

  // Derived metrics
  const totalJobsCount = jobs.length;
  const criticalJobsCount = priorities.filter(
    (j) => j.priority_level === 'CRITICAL' || j.criticality >= 8
  ).length;

  const metrics = latestRunDetails?.metrics || {};
  const scheduledCount = metrics.jobs_scheduled ?? 0;
  const unscheduledCount = metrics.jobs_unscheduled ?? 0;
  const totalBlockMinutes = metrics.total_block_minutes ?? 0;
  const blockSavingsMinutes = metrics.block_savings_minutes ?? 0;
  const activeBlocksCount = latestRunDetails?.blocks?.length ?? 0;
  const deadlineCompliance = metrics.jobs_considered
    ? Math.round((metrics.deadline_met_count / metrics.jobs_considered) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Operational Planning Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time maintenance KPIs, active block schedules, and optimization analytics for Indian Railways
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/planning"
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <span>Open Daily Planning</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* Planning Intelligence Pipeline Explanation */}
      <PlanningPipelineBanner />

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadDashboardData}
            className="ml-auto underline text-xs text-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Maintenance Jobs */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Work Orders</span>
            <Wrench className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{totalJobsCount}</span>
            <span className="text-[11px] text-slate-500 ml-2">jobs registered</span>
          </div>
        </div>

        {/* Card 2: Critical Jobs */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Critical Priority</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{criticalJobsCount}</span>
            <span className="text-[11px] text-slate-500 ml-2">critical safety tasks</span>
          </div>
        </div>

        {/* Card 3: Scheduled Jobs */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Scheduled in Plan</span>
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{scheduledCount}</span>
            <span className="text-[11px] text-slate-500 ml-2">jobs accommodated</span>
          </div>
        </div>

        {/* Card 4: Unscheduled Jobs */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Unscheduled</span>
            <CalendarX className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{unscheduledCount}</span>
            <span className="text-[11px] text-slate-500 ml-2">unaccommodated</span>
          </div>
        </div>

        {/* Card 5: Active Blocks */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Coordinated Blocks</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{activeBlocksCount}</span>
            <span className="text-[11px] text-slate-500 ml-2">blocks proposed</span>
          </div>
        </div>

        {/* Card 6: Total Block Time */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Block Time</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{totalBlockMinutes}</span>
            <span className="text-[11px] text-slate-500 ml-2">minutes corridor time</span>
          </div>
        </div>

        {/* Card 7: Consolidation Savings */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Block Consolidation</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">+{blockSavingsMinutes}</span>
            <span className="text-[11px] text-emerald-500/80 ml-2">mins downtime saved</span>
          </div>
        </div>

        {/* Card 8: Deadline Compliance */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Deadline Compliance</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-blue-400">{deadlineCompliance}%</span>
            <span className="text-[11px] text-slate-500 ml-2">on-time adherence</span>
          </div>
        </div>
      </div>

      {/* Recent Planning Runs Table */}
      <Card
        title="Planning Runs History & Audit Trail"
        subtitle={`Audit ledger of plan generations and dynamic replans for ${planDate}`}
        action={
          <NavLink
            to="/planning/compare"
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
          >
            <span>Compare Runs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        }
      >
        {runs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No planning runs generated yet for {planDate}. Open Daily Planning to generate the first proposal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Run Code</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Trigger / Reason</th>
                  <th className="py-2.5 px-3">Scheduled</th>
                  <th className="py-2.5 px-3">Block Time</th>
                  <th className="py-2.5 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-slate-200">
                      {r.run_code || r.id.slice(0, 8)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700">
                        {r.run_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={r.status?.toLowerCase() || 'proposed'} size="xs">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate font-sans">
                      {r.reason || 'Daily Schedule'}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400">
                      {r.metrics?.jobs_scheduled ?? '--'} jobs
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {r.metrics?.total_block_minutes ?? '--'}m
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {r.created_at ? new Date(r.created_at).toLocaleTimeString() : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
