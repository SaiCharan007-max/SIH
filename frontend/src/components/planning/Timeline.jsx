import React from 'react';
import { TimelineHeader } from './TimelineHeader';
import { TimelineSectionRow } from './TimelineSectionRow';
import { Train, Wrench, Layers } from 'lucide-react';

export const Timeline = ({
  sections = [],
  trains = [],
  blocks = [],
  onSelectBlock,
  onSelectTrain
}) => {
  // Group trains and blocks by section_id or section_code
  const trainsBySection = {};
  for (const t of trains) {
    const sId = t.section_id;
    if (!trainsBySection[sId]) trainsBySection[sId] = [];
    trainsBySection[sId].push(t);
  }

  const blocksBySection = {};
  for (const b of blocks) {
    const sId = b.section_id;
    if (!blocksBySection[sId]) blocksBySection[sId] = [];
    blocksBySection[sId].push(b);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
      {/* Legend & Channel Description Bar */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <span className="font-semibold text-slate-200">Timeline Legend:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-600 border border-blue-400/50" />
            <span className="text-slate-400">Passenger Train</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-700 border border-slate-600" />
            <span className="text-slate-400">Freight Train</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-amber-500/50 bg-slate-900" />
            <span className="text-slate-400">Coordinated Block</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> ENG
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> TRD
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> S&T
          </span>
        </div>
      </div>

      {/* Horizontally scrollable timeline container */}
      <div className="overflow-x-auto min-w-full">
        <div className="min-w-[950px]">
          <TimelineHeader windowStart="06:00" windowEnd="22:00" />

          <div className="divide-y divide-slate-800/60">
            {sections.map((section) => (
              <TimelineSectionRow
                key={section.id || section.section_code}
                section={section}
                trains={trainsBySection[section.id] || []}
                blocks={blocksBySection[section.id] || []}
                onSelectBlock={onSelectBlock}
                onSelectTrain={onSelectTrain}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
