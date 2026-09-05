import React from 'react';
import { Wrench, Layers } from 'lucide-react';
import { TimelineJob } from './TimelineJob';
import { calculateTimelinePosition, formatTime } from '../../utils/timeUtils';

export const TimelineBlock = ({ block, onClick }) => {
  const { leftPct, widthPct } = calculateTimelinePosition(
    block.start_time,
    block.end_time
  );

  const jobs = block.jobs || [];
  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))];
  const isMultiDept = departments.length > 1;

  return (
    <div
      className="absolute top-1 bottom-1 rounded-lg border border-amber-500/50 bg-slate-900/95 hover:bg-slate-850 hover:border-amber-400 p-1.5 shadow-md shadow-black/40 cursor-pointer transition-all z-10 flex flex-col justify-between overflow-hidden group"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        minWidth: '40px'
      }}
      onClick={() => onClick && onClick(block)}
      title={`Block: ${block.block_code} (${formatTime(block.start_time)} - ${formatTime(block.end_time)}) - ${jobs.length} jobs`}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between gap-1 text-[9.5px] font-mono leading-none mb-1 text-amber-300">
        <div className="flex items-center gap-1 truncate font-semibold">
          {isMultiDept ? (
            <Layers className="w-3 h-3 text-emerald-400 shrink-0" title="Joint Multi-Department Block" />
          ) : (
            <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
          )}
          <span className="truncate">{block.block_code}</span>
        </div>
        <span className="opacity-75 text-[8.5px] shrink-0 hidden sm:inline">
          {formatTime(block.start_time)}-{formatTime(block.end_time)}
        </span>
      </div>

      {/* Nested Departmental Jobs Container */}
      <div className="space-y-1 overflow-hidden">
        {jobs.slice(0, 3).map((job) => (
          <TimelineJob
            key={job.job_id || job.id || job.job_code}
            job={job}
            blockStartStr={block.start_time}
            blockEndStr={block.end_time}
          />
        ))}
        {jobs.length > 3 && (
          <div className="text-[8px] font-mono text-slate-400 text-center leading-none">
            +{jobs.length - 3} more jobs
          </div>
        )}
      </div>
    </div>
  );
};
