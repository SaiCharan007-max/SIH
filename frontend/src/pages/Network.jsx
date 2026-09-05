import React, { useState, useEffect } from 'react';
import { NetworkGraph } from '../components/network/NetworkGraph';
import { SectionDetailPanel } from '../components/network/SectionDetailPanel';
import {
  getStations,
  getSections,
  getAssets,
  getMaintenanceJobs,
  getPlanningRuns,
  getPlanningRun
} from '../services/api';
import { Network as NetworkIcon, RefreshCw, AlertTriangle } from 'lucide-react';

export const Network = ({ planDate = '2026-09-10' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stations, setStations] = useState([]);
  const [sections, setSections] = useState([]);
  const [assets, setAssets] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [currentPlanBlocks, setCurrentPlanBlocks] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stns, secs, asts, jbs, runs] = await Promise.all([
        getStations(),
        getSections(),
        getAssets(),
        getMaintenanceJobs(),
        getPlanningRuns({ plan_date: planDate })
      ]);

      setStations(stns);
      setSections(secs);
      setAssets(asts);
      setJobs(jbs);

      if (secs.length > 0 && !selectedSection) {
        setSelectedSection(secs[0]);
      }

      if (runs.length > 0) {
        const fullPlan = await getPlanningRun(runs[0].id);
        setCurrentPlanBlocks(fullPlan?.blocks || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load network infrastructure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetworkData();
  }, [planDate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <NetworkIcon className="w-5 h-5 text-amber-400" />
            Railway Infrastructure Network Topology
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Physical stations, track corridor sections, assets, and active maintenance coverage
          </p>
        </div>

        <button
          onClick={loadNetworkData}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-2 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Network</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Network Graph Visualizer */}
      <NetworkGraph
        stations={stations}
        sections={sections}
        selectedSectionId={selectedSection?.id}
        onSelectSection={(sec) => setSelectedSection(sec)}
      />

      {/* Section Inspector Details */}
      <SectionDetailPanel
        section={selectedSection}
        assets={assets}
        jobs={jobs}
        blocks={currentPlanBlocks}
      />
    </div>
  );
};
