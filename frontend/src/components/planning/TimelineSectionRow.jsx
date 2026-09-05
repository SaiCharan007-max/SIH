import React from 'react';
import { Zap, GitCommit } from 'lucide-react';
import { TimelineTrain } from './TimelineTrain';
import { TimelineBlock } from './TimelineBlock';

export const TimelineSectionRow = ({
  section,
  trains = [],
  blocks = [],
  onSelectBlock,
  onSelectTrain
}) => {
  // Grid lines every 2 hours from 06:00 to 22:00 (8 intervals)
  const gridTicks = [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];

  return (
    <div className="flex border-b border-slate-800/80 hover:bg-slate-900/40 transition-colors">
      {/* Section Info Column */}
      <div className="w-48 shrink-0 p-3.5 border-r border-slate-800/80 flex flex-col justify-center select-none bg-slate-950/60">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-xs text-slate-100">
            {section.section_code}
          </span>
          {section.electrified && (
            <Zap className="w-3 h-3 text-amber-400 shrink-0" title="25kV Electrified" />
          )}
        </div>
        <div className="text-[11px] text-slate-400 truncate mt-0.5" title={section.name}>
          {section.from_station_code || 'STN-A'} &rarr; {section.to_station_code || 'STN-B'}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
          <span>{section.track_count || 1} Track{section.track_count > 1 ? 's' : ''}</span>
          {section.length_km && <span>&bull; {section.length_km} km</span>}
        </div>
      </div>

      {/* Multi-Track Occupancy Channels */}
      <div className="flex-1 relative min-w-[700px] flex flex-col py-1.5 px-2">
        {/* Background Vertical Grid Guide Lines */}
        <div className="absolute inset-0 pointer-events-none">
          {gridTicks.map((pct) => (
            <div
              key={pct}
              className="absolute top-0 bottom-0 w-px bg-slate-800/40"
              style={{ left: `${pct}%` }}
            />
          ))}
        </div>

        {/* Channel 1: Train Occupancy Track */}
        <div className="relative h-8 mb-1.5 rounded bg-slate-950/40 border border-slate-800/40">
          {trains.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-slate-600 select-none">
              No trains scheduled
            </div>
          ) : (
            trains.map((train) => (
              <TimelineTrain
                key={train.id || train.movement_id || train.train_number}
                train={train}
                onClick={onSelectTrain}
              />
            ))
          )}
        </div>

        {/* Channel 2: Coordinated Maintenance Blocks Track */}
        <div className="relative h-20 rounded bg-slate-950/60 border border-slate-800/60">
          {blocks.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-slate-600 select-none">
              Corridor clear / No maintenance blocks
            </div>
          ) : (
            blocks.map((block) => (
              <TimelineBlock
                key={block.id || block.block_code}
                block={block}
                onClick={onSelectBlock}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
