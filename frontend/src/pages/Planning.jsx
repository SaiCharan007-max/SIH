import React, { useState, useEffect } from 'react';
import { Timeline } from '../components/planning/Timeline';
import { BlockDetailModal } from '../components/planning/BlockDetailModal';
import { TrainDetailModal } from '../components/planning/TrainDetailModal';
import { DisruptionModal } from '../components/planning/DisruptionModal';
import { UnscheduledJobsList } from '../components/planning/UnscheduledJobsList';
import { PlanningPipelineBanner } from '../components/planning/PlanningPipelineBanner';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  getSections,
  getTrainMovements,
  getPlanningRuns,
  getPlanningRun,
  generatePlan,
  replan,
} from '../services/api';
import {
  CalendarClock,
  Play,
  AlertTriangle,
  RefreshCw,
  GitCompare,
  Layers,
  Clock,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Sliders,
  Radio,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Planning = ({ planDate: initialPlanDate = '2026-09-10', onPlanUpdated }) => {
  const [planDate, setPlanDate] = useState(initialPlanDate);
  const [planningWindow, setPlanningWindow] = useState('06:00 - 22:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Core planning state
  const [sections, setSections] = useState([]);
  const [trains, setTrains] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planningRuns, setPlanningRuns] = useState([]);

  // Modals & Panels state
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [isDisruptionModalOpen, setIsDisruptionModalOpen] = useState(false);

  const loadPlanningData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sectionsData, trainsData, runsData] = await Promise.all([
        getSections(),
        getTrainMovements(planDate),
        getPlanningRuns({ plan_date: planDate }),
      ]);

      setSections(sectionsData || []);
      setTrains(trainsData || []);
      setPlanningRuns(runsData || []);

      if (runsData && runsData.length > 0) {
        const fullPlan = await getPlanningRun(runsData[0].id);
        setCurrentPlan(fullPlan);
        if (onPlanUpdated) onPlanUpdated(fullPlan);
      } else {
        setCurrentPlan(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load daily planning data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanningData();
  }, [planDate]);

  // Handler: Generate Initial Plan
  const handleGeneratePlan = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      const [startTime, endTime] = planningWindow.split(' - ').map((s) => s.trim());
      const generatedRun = await generatePlan({
        plan_date: planDate,
        start_time: startTime || '06:00',
        end_time: endTime || '22:00',
      });

      setSuccessMsg(
        `Proposed block plan generated: ${generatedRun.run_code || 'PROPOSAL'} with ${
          generatedRun.blocks?.length || 0
        } coordinated corridor blocks.`
      );
      await loadPlanningData();
    } catch (err) {
      setError(err.message || 'Failed to generate maintenance block plan');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Execute Disruption Replan
  const handleReplanSubmit = async (eventPayload) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      setIsDisruptionModalOpen(false);

      const replanResult = await replan({
        plan_date: planDate,
        event: eventPayload,
      });

      setSuccessMsg(
        `Dynamic replan generated: ${replanResult.run_code}. Unchanged blocks: ${replanResult.unchanged_blocks}, Rescheduled: ${replanResult.metrics?.jobs_rescheduled || 1}.`
      );
      await loadPlanningData();
    } catch (err) {
      setError(err.message || 'Dynamic replanning failed');
    } finally {
      setLoading(false);
    }
  };

  const metrics = currentPlan?.metrics || {};
  const activeBlocks = currentPlan?.blocks || [];
  const unscheduledJobs = currentPlan?.unscheduled_jobs || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Operational Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Proposal Status */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-amber-400" />
              Daily Block Planning
            </h1>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                PROPOSED
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>AI-generated proposal · Requires operational review</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated conflict-free corridor track possessions coordinating Civil Engineering, TRD, and S&T
          </p>
        </div>

        {/* Operational Controls: Date, Planning Window, Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 text-[11px] font-mono">Date:</span>
            <input
              type="date"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              className="bg-transparent font-mono text-slate-100 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Planning Window Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-200">
            <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400 text-[11px] font-mono">Window:</span>
            <select
              value={planningWindow}
              onChange={(e) => setPlanningWindow(e.target.value)}
              className="bg-transparent font-mono text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="06:00 - 22:00" className="bg-slate-900">06:00 - 22:00 (Day)</option>
              <option value="00:00 - 24:00" className="bg-slate-900">00:00 - 24:00 (Full 24h)</option>
              <option value="22:00 - 06:00" className="bg-slate-900">22:00 - 06:00 (Night)</option>
            </select>
          </div>

          {/* Generate Plan Button */}
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Generate Plan</span>
          </button>

          {/* Simulate Disruption Button */}
          <button
            onClick={() => setIsDisruptionModalOpen(true)}
            disabled={loading || !currentPlan}
            className="px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Disruption</span>
          </button>

          {/* Compare Runs Button */}
          {planningRuns.length > 1 && (
            <NavLink
              to="/planning/compare"
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5 text-slate-400" />
              <span>Compare ({planningRuns.length})</span>
            </NavLink>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadPlanningData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh planning schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadPlanningData}
            className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Planning Proposal Metrics Strip */}
      {currentPlan && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Coordinated Blocks</span>
              <div className="text-base font-bold font-mono text-slate-100">
                {activeBlocks.length} Blocks
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Total Block Window</span>
              <div className="text-base font-bold font-mono text-cyan-300">
                {metrics.total_block_minutes ?? 0} mins
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Track Downtime Saved</span>
              <div className="text-base font-bold font-mono text-emerald-400">
                +{metrics.block_savings_minutes ?? 0} mins
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Scheduled vs Considered</span>
              <div className="text-base font-bold font-mono text-slate-100">
                {metrics.jobs_scheduled ?? 0}{' '}
                <span className="text-xs text-slate-500">/ {metrics.jobs_considered ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Operational Timeline View */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <span>Corridor Section Timetable & Maintenance Possessions (06:00 &mdash; 22:00)</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Click any block to inspect multi-department jobs & corridor savings
          </span>
        </div>

        {loading && !currentPlan ? (
          <div className="h-64 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center animate-pulse">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Loading railway section schedules and train movements...</span>
            </div>
          </div>
        ) : !currentPlan && activeBlocks.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800">
            <CalendarClock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-200">No Planning Run</div>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              No optimized maintenance plan has been generated for this date. Click "Generate Plan" to compute conflict-free possession blocks with CP-SAT.
            </p>
            <button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="mt-4 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Generate Plan</span>
            </button>
          </div>
        ) : (
          <Timeline
            sections={sections}
            trains={trains}
            blocks={activeBlocks}
            onSelectBlock={(b) => setSelectedBlock(b)}
            onSelectTrain={(t) => setSelectedTrain(t)}
          />
        )}
      </div>

      {/* Decision-Support Planning Intelligence Explanation Banner */}
      <PlanningPipelineBanner />

      {/* Unscheduled Maintenance Work Section */}
      <UnscheduledJobsList unscheduledJobs={unscheduledJobs} />

      {/* Slide-over Side Drawer for Block Inspection */}
      <BlockDetailModal
        block={selectedBlock}
        isOpen={Boolean(selectedBlock)}
        onClose={() => setSelectedBlock(null)}
      />

      {/* Train Movement Details Modal */}
      <TrainDetailModal
        train={selectedTrain}
        isOpen={Boolean(selectedTrain)}
        onClose={() => setSelectedTrain(null)}
      />

      {/* Dynamic Disruption Modal */}
      <DisruptionModal
        isOpen={isDisruptionModalOpen}
        onClose={() => setIsDisruptionModalOpen(false)}
        onSubmit={handleReplanSubmit}
        loading={loading}
        sections={sections}
        currentPlan={currentPlan}
      />
    </div>
  );
};
