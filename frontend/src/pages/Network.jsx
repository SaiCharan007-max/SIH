import React, { useState, useEffect } from 'react';
import { NetworkGraph } from '../components/network/NetworkGraph';
import { SectionDetailPanel } from '../components/network/SectionDetailPanel';
import {
  getStations,
  getSections,
  getAssets,
  getMaintenanceJobs,
  getPlanningRuns,
  getPlanningRun,
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
        getPlanningRuns({ plan_date: planDate }),
      ]);

      setStations(stns || []);
      setSections(secs || []);
      setAssets(asts || []);
      setJobs(jbs || []);

      if (secs && secs.length > 0 && !selectedSection) {
        setSelectedSection(secs[0]);
      }

      if (runs && runs.length > 0) {
        try {
          const fullPlan = await getPlanningRun(runs[0].id);
          setCurrentPlanBlocks(fullPlan?.blocks || []);
        } catch {
          setCurrentPlanBlocks([]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load railway network infrastructure');
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <NetworkIcon className="w-5 h-5 text-amber-400" />
              Railway Network Topology
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {sections.length} Corridors &bull; {stations.length} Stations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Logical station nodes, track section connections, installed assets, and active maintenance coverage
          </p>
        </div>

        <button
          onClick={loadNetworkData}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
          title="Refresh network topology"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
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
      {loading ? (
        <div className="h-72 rounded-xl bg-slate-900 border border-slate-800 animate-pulse flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Loading railway topology graph...</span>
          </div>
        </div>
      ) : (
        <NetworkGraph
          stations={stations}
          sections={sections}
          selectedSectionId={selectedSection?.id}
          onSelectSection={(sec) => setSelectedSection(sec)}
        />
      )}

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
