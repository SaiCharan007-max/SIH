import React, { useState, useEffect } from 'react';
import { Timeline } from '../components/planning/Timeline';
import { BlockDetailModal } from '../components/planning/BlockDetailModal';
import { TrainDetailModal } from '../components/planning/TrainDetailModal';
import { DisruptionModal } from '../components/planning/DisruptionModal';
import { UnscheduledJobsList } from '../components/planning/UnscheduledJobsList';
import { Badge } from '../components/common/Badge';
import {
  getSections,
  getTrainMovements,
  getPlanningRuns,
  getPlanningRun,
  generatePlan,
  replan
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
  CheckCircle2
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Planning = ({ planDate = '2026-09-10', onPlanUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Core planning state
  const [sections, setSections] = useState([]);
  const [trains, setTrains] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planningRuns, setPlanningRuns] = useState([]);

  // Modals state
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
        getPlanningRuns({ plan_date: planDate })
      ]);

      setSections(sectionsData);
      setTrains(trainsData);
      setPlanningRuns(runsData);

      if (runsData.length > 0) {
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

      const generatedRun = await generatePlan({
        plan_date: planDate,
        start_time: '06:00',
        end_time: '22:00'
      });

      setSuccessMsg(`Proposed plan generated: ${generatedRun.run_code} (${generatedRun.blocks?.length || 0} coordinated blocks).`);
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
        event: eventPayload
      });

      setSuccessMsg(
        `Dynamic replan complete: ${replanResult.run_code}. Unchanged blocks: ${replanResult.unchanged_blocks}, Rescheduled: ${replanResult.metrics?.jobs_rescheduled || 1}.`
      );
      await loadPlanningData();
    } catch (err) {
      setError(err.message || 'Replanning failed');
    } finally {
      setLoading(false);
    }
  };

  const metrics = currentPlan?.metrics || {};
  const activeBlocks = currentPlan?.blocks || [];
  const unscheduledJobs = currentPlan?.unscheduled_jobs || [];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-amber-400" />
              Daily Maintenance Block Planning
            </h1>
            {currentPlan && (
              <Badge variant={currentPlan.status?.toLowerCase() || 'proposed'}>
                {currentPlan.status || 'PROPOSED'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordinate track possession across Civil Engineering, Traction, and Signal & Telecom without train conflicts
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Generate Plan Button */}
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Generate Plan</span>
          </button>

          {/* Simulate Disruption Button */}
          <button
            onClick={() => setIsDisruptionModalOpen(true)}
            disabled={loading || !currentPlan}
            className="px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Disruption</span>
          </button>

          {/* Compare Button */}
          {planningRuns.length > 1 && (
            <NavLink
              to="/planning/compare"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5 text-slate-400" />
              <span>Compare Runs ({planningRuns.length})</span>
            </NavLink>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadPlanningData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors disabled:opacity-50"
            title="Refresh planning schedule"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary Metrics Strip */}
      {currentPlan && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Coordinated Blocks</span>
              <div className="text-base font-bold font-mono text-slate-100">{activeBlocks.length} Blocks</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Total Block Window</span>
              <div className="text-base font-bold font-mono text-slate-100">{metrics.total_block_minutes ?? 0} mins</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Track Downtime Saved</span>
              <div className="text-base font-bold font-mono text-emerald-400">+{metrics.block_savings_minutes ?? 0} mins</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Scheduled vs Unscheduled</span>
              <div className="text-base font-bold font-mono text-slate-100">
                {metrics.jobs_scheduled ?? 0} <span className="text-xs text-slate-500">/ {metrics.jobs_considered ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Operational Timeline View */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Multi-Track Section Timetable & Maintenance Corridors (06:00 &mdash; 22:00)
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Click any block or train to inspect operational details
          </span>
        </div>

        <Timeline
          sections={sections}
          trains={trains}
          blocks={activeBlocks}
          onSelectBlock={(b) => setSelectedBlock(b)}
          onSelectTrain={(t) => setSelectedTrain(t)}
        />
      </div>

      {/* Unscheduled Maintenance Work Section */}
      <UnscheduledJobsList unscheduledJobs={unscheduledJobs} />

      {/* Modals */}
      <BlockDetailModal
        block={selectedBlock}
        isOpen={Boolean(selectedBlock)}
        onClose={() => setSelectedBlock(null)}
      />

      <TrainDetailModal
        train={selectedTrain}
        isOpen={Boolean(selectedTrain)}
        onClose={() => setSelectedTrain(null)}
      />

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
