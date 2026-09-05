import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { PlanningPipelineBanner } from '../components/planning/PlanningPipelineBanner';
import {
  getMaintenanceJobs,
  getMaintenancePriorities,
  getPlanningRuns,
  getPlanningRun,
} from '../services/api';
import {
  Wrench,
  AlertTriangle,
  CalendarCheck,
  CalendarX,
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Zap,
  Radio,
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
        getPlanningRuns({ plan_date: planDate }),
      ]);

      setJobs(jobsData || []);
      setPriorities(prioritiesData || []);
      setRuns(runsData || []);

      if (runsData && runsData.length > 0) {
        try {
          const details = await getPlanningRun(runsData[0].id);
          setLatestRunDetails(details);
        } catch (detailErr) {
          console.warn('Could not load latest run details:', detailErr);
          setLatestRunDetails(null);
        }
      } else {
        setLatestRunDetails(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load operational dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [planDate]);

  // Derived KPIs from backend data
  const totalJobsCount = jobs.length;
  const criticalJobsCount = priorities.filter(
    (j) => j.priority_level === 'CRITICAL' || (j.criticality && j.criticality >= 8)
  ).length;

  const metrics = latestRunDetails?.metrics || {};
  const scheduledCount = metrics.jobs_scheduled ?? 0;
  const unscheduledCount = metrics.jobs_unscheduled ?? 0;
  const totalBlockMinutes = metrics.total_block_minutes ?? 0;
  const blockSavingsMinutes = metrics.block_savings_minutes ?? 0;

  // Breakdown by department
  const deptCounts = jobs.reduce((acc, job) => {
    const dept = job.department || 'OTHER';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Operations Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Network Operations
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintenance availability and block planning overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors disabled:opacity-50"
            title="Refresh network dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <NavLink
            to="/planning"
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/15 transition-all"
          >
            <span>Open Daily Planning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* Error state if API fails */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top KPI Strip - Compact, Sophisticated Operations Layout */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* KPI 1: Maintenance Jobs */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-750 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium tracking-wide">Maintenance Jobs</span>
              <Wrench className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">
              {totalJobsCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Active engineering requests
            </div>
          </div>

          {/* KPI 2: Critical Jobs */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-750 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium tracking-wide">Critical Jobs</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {criticalJobsCount}
            </div>
            <div className="text-[10px] text-amber-500/80 mt-0.5 truncate">
              High risk or near deadline
            </div>
          </div>

          {/* KPI 3: Scheduled */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-750 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium tracking-wide">Scheduled</span>
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {scheduledCount}
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5 truncate">
              Assigned to corridor blocks
            </div>
          </div>

          {/* KPI 4: Unscheduled */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-750 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium tracking-wide">Unscheduled</span>
              <CalendarX className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              {unscheduledCount}
            </div>
            <div className="text-[10px] text-rose-400/80 mt-0.5 truncate">
              Pending corridor window
            </div>
          </div>

          {/* KPI 5: Block Time */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-750 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium tracking-wide">Block Time</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {totalBlockMinutes} min
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Total track possession
            </div>
          </div>

          {/* KPI 6: Block Savings */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-750 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium tracking-wide">Block Savings</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {blockSavingsMinutes} min
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5 truncate">
              Multi-dept bundling savings
            </div>
          </div>
        </div>
      )}

      {/* Decision-Support Planning Intelligence Pipeline */}
      <PlanningPipelineBanner />

      {/* Operational Sections & Active Planning Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Department Backlog Distribution */}
        <Card
          title="Maintenance Work Orders"
          subtitle="Departmental workload awaiting block possession"
        >
          <div className="space-y-3">
            {[
              {
                dept: 'ENG',
                name: 'Civil Engineering',
                count: deptCounts['ENG'] || 0,
                color: 'bg-amber-500',
                border: 'border-amber-500/30',
                badge: 'bg-amber-500/10 text-amber-400',
              },
              {
                dept: 'TRD',
                name: 'Traction Distribution (OHE)',
                count: deptCounts['TRD'] || 0,
                color: 'bg-cyan-500',
                border: 'border-cyan-500/30',
                badge: 'bg-cyan-500/10 text-cyan-400',
              },
              {
                dept: 'SNT',
                name: 'Signal & Telecom',
                count: deptCounts['SNT'] || 0,
                color: 'bg-purple-500',
                border: 'border-purple-500/30',
                badge: 'bg-purple-500/10 text-purple-400',
              },
            ].map((d) => {
              const pct = totalJobsCount ? Math.round((d.count / totalJobsCount) * 100) : 0;
              return (
                <div
                  key={d.dept}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">{d.name}</span>
                      <span className="text-xs font-mono font-bold text-slate-100">
                        {d.count} jobs
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${d.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${d.border} ${d.badge}`}
                  >
                    {d.dept}
                  </span>
                </div>
              );
            })}

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Coordinated multi-dept opportunity:</span>
              <span className="font-semibold text-amber-400 font-mono">
                {blockSavingsMinutes > 0 ? `${blockSavingsMinutes} min recovered` : 'Active'}
              </span>
            </div>
          </div>
        </Card>

        {/* Latest Planning Proposal Summary */}
        <div className="lg:col-span-2">
          <Card
            title="Active Block Planning Proposal"
            subtitle={`Optimization run generated for service date: ${planDate}`}
          >
            {latestRunDetails ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-slate-100">
                        {latestRunDetails.run_code}
                      </span>
                      <Badge variant="proposed" size="xs">
                        {latestRunDetails.status || 'PROPOSED'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {latestRunDetails.blocks?.length || 0} corridor blocks ·{' '}
                      {latestRunDetails.metrics?.jobs_scheduled || 0} jobs scheduled ·{' '}
                      {latestRunDetails.metrics?.jobs_unscheduled || 0} unscheduled
                    </p>
                  </div>

                  <NavLink
                    to="/planning"
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </NavLink>
                </div>

                {/* Coordinated blocks sample */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Recent Coordinated Possessions
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(latestRunDetails.blocks || []).slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-400">
                              {b.block_code}
                            </span>
                            <span className="text-[10px] text-slate-400">{b.section_code}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                            {b.start_time?.slice(0, 5)} → {b.end_time?.slice(0, 5)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                            {b.jobs?.length || 0} jobs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800">
                <CalendarCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-300">No Active Planning Run</div>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Generate an initial maintenance block proposal in the Daily Planning section.
                </p>
                <NavLink
                  to="/planning"
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/15"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Generate Plan</span>
                </NavLink>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Historical Runs Audit Table */}
      {runs.length > 0 && (
        <Card
          title="Planning Runs History"
          subtitle="Audit log of optimization runs, replan events, and operational versions"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] font-mono uppercase">
                <tr>
                  <th className="py-2.5 px-3">Run Code</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Blocks</th>
                  <th className="py-2.5 px-3">Jobs Sched.</th>
                  <th className="py-2.5 px-3">Block Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {runs.slice(0, 6).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-200">{r.run_code}</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {typeof r.plan_date === 'string' ? r.plan_date.slice(0, 10) : r.plan_date}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{r.run_type || 'INITIAL'}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={r.status?.toLowerCase() || 'proposed'} size="xs">
                        {r.status || 'PROPOSED'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{r.metrics?.total_blocks ?? '-'}</td>
                    <td className="py-2.5 px-3 text-emerald-400">
                      {r.metrics?.jobs_scheduled ?? '-'}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300">
                      {r.metrics?.total_block_minutes ? `${r.metrics.total_block_minutes} min` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <NavLink
                        to="/planning"
                        className="text-amber-400 hover:text-amber-300 text-xs font-sans font-semibold inline-flex items-center gap-1"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </NavLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
