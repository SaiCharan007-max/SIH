import React from 'react';
import { calculateTimelinePosition, formatTime } from '../../utils/timeUtils';
import { getDepartmentInfo } from '../../utils/departmentConfig';

export const TimelineBlock = ({ block, onClick }) => {
  const { leftPct, widthPct } = calculateTimelinePosition(
    block.start_time,
    block.end_time
  );

  const jobs = block.jobs || [];
  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))];

  return (
    <div
      className="absolute top-1 bottom-1 rounded border border-amber-500/60 bg-slate-900/95 hover:bg-slate-850 hover:border-amber-400 px-2 py-1 shadow-sm cursor-pointer transition-colors z-10 flex flex-col justify-between overflow-hidden group select-none"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        minWidth: '55px',
      }}
      onClick={() => onClick && onClick(block)}
      title={`Block: ${block.block_code} (${formatTime(block.start_time)}–${formatTime(block.end_time)}) · ${jobs.length} jobs`}
    >
      {/* Block Code & Time */}
      <div className="flex items-center justify-between gap-1 text-[10px] font-mono leading-tight">
        <span className="font-bold text-amber-400 truncate">
          {block.block_code}
        </span>
        <span className="text-[9px] text-slate-400 shrink-0 font-mono hidden sm:inline">
          {formatTime(block.start_time)}–{formatTime(block.end_time)}
        </span>
      </div>

      {/* Jobs Summary & Department Tags */}
      <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-slate-400 mt-0.5">
        <span className="font-medium text-slate-300">
          {jobs.length} job{jobs.length === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-1">
          {departments.map((dept) => {
            const info = getDepartmentInfo(dept);
            return (
              <span
                key={dept}
                className="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300"
              >
                {info.shortName}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
