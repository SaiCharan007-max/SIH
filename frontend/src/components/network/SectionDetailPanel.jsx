import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { getDepartmentInfo } from '../../utils/departmentConfig';
import { formatTime } from '../../utils/timeUtils';
import { TrainTrack, Zap, Wrench, Shield, CalendarClock } from 'lucide-react';

export const SectionDetailPanel = ({
  section,
  assets = [],
  jobs = [],
  blocks = []
}) => {
  if (!section) {
    return (
      <Card title="Section Inspector" subtitle="Select a section to inspect details">
        <div className="p-8 text-center text-slate-500 text-xs">
          Select any railway section edge from the topology map to view its physical characteristics, installed assets, and scheduled maintenance.
        </div>
      </Card>
    );
  }

  const sectionAssets = assets.filter((a) => a.section_id === section.id);
  const sectionJobs = jobs.filter((j) => j.section_id === section.id);
  const sectionBlocks = blocks.filter((b) => b.section_id === section.id);

  return (
    <Card
      title={`Section Details: ${section.section_code}`}
      subtitle={`${section.from_station_code || 'STN-A'} \u2192 ${section.to_station_code || 'STN-B'} (${section.length_km} km)`}
    >
      <div className="space-y-5 text-xs">
        {/* Core Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 font-mono">
          <div>
            <span className="text-slate-500 text-[10px]">Track Lines</span>
            <div className="text-slate-200 font-bold">{section.track_count || 1} Track</div>
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">Electrification</span>
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              {section.electrified ? <Zap className="w-3.5 h-3.5" /> : null}
              <span>{section.electrified ? '25kV AC' : 'Non-Elec'}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">Length</span>
            <div className="text-slate-200 font-bold">{section.length_km} km</div>
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">Active Blocks</span>
            <div className="text-emerald-400 font-bold">{sectionBlocks.length} Blocks</div>
          </div>
        </div>

        {/* Assets on Section */}
        <div>
          <h4 className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Installed Railway Assets</span>
            <span className="text-slate-500 font-mono text-[11px]">({sectionAssets.length})</span>
          </h4>
          {sectionAssets.length === 0 ? (
            <p className="text-slate-500 text-[11px]">No assets registered on this section.</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {sectionAssets.map((asset) => {
                const dept = getDepartmentInfo(asset.department);
                return (
                  <div
                    key={asset.id || asset.asset_code}
                    className="p-2 rounded bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-slate-200">{asset.asset_code}</span>
                      <span className="text-slate-400 truncate">{asset.asset_name || asset.name}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border shrink-0 ${dept.badgeColor}`}>
                      {dept.shortName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Maintenance Jobs on Section */}
        <div>
          <h4 className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Pending Maintenance Jobs</span>
            <span className="text-slate-500 font-mono text-[11px]">({sectionJobs.length})</span>
          </h4>
          {sectionJobs.length === 0 ? (
            <p className="text-slate-500 text-[11px]">No pending maintenance requests for this section.</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {sectionJobs.map((j) => {
                const dept = getDepartmentInfo(j.department);
                return (
                  <div
                    key={j.id || j.job_code}
                    className="p-2 rounded bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-2 text-[11px] font-mono"
                  >
                    <div className="truncate">
                      <span className="font-bold text-slate-200">{j.job_code}</span>
                      <span className="text-slate-400 ml-2 truncate">{j.work_type || j.description}</span>
                    </div>
                    <span className="text-amber-400 shrink-0 font-bold">
                      {j.duration_minutes || j.estimated_duration_minutes || 60}m
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Blocks on Section */}
        <div>
          <h4 className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Today's Coordinated Blocks</span>
            <span className="text-slate-500 font-mono text-[11px]">({sectionBlocks.length})</span>
          </h4>
          {sectionBlocks.length === 0 ? (
            <p className="text-slate-500 text-[11px]">No maintenance blocks scheduled on this corridor yet.</p>
          ) : (
            <div className="space-y-1.5">
              {sectionBlocks.map((b) => (
                <div
                  key={b.id || b.block_code}
                  className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-amber-300">{b.block_code}</span>
                    <span className="text-slate-400">
                      ({formatTime(b.start_time)} &rarr; {formatTime(b.end_time)})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {b.jobs?.length || 0} jobs combined
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
