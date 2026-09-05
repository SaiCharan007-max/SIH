import React from 'react';
import { getDepartmentInfo } from '../../utils/departmentConfig';
import { timeToMinutes, formatTime } from '../../utils/timeUtils';

export const TimelineJob = ({ job, blockStartStr, blockEndStr }) => {
  const deptInfo = getDepartmentInfo(job.department);

  const blockStartMin = timeToMinutes(blockStartStr);
  const blockEndMin = timeToMinutes(blockEndStr);
  const blockTotalMin = Math.max(1, blockEndMin - blockStartMin);

  const jobStartMin = timeToMinutes(job.start_time || job.planned_start);
  const jobEndMin = timeToMinutes(job.end_time || job.planned_end);

  const leftPct = ((jobStartMin - blockStartMin) / blockTotalMin) * 100;
  const widthPct = Math.max(1.5, ((jobEndMin - jobStartMin) / blockTotalMin) * 100);

  return (
    <div
      className={`h-4.5 rounded text-[9px] font-mono px-1 flex items-center gap-1 shadow-sm border border-slate-700/60 overflow-hidden select-none transition-transform hover:scale-[1.02] ${deptInfo.badgeColor}`}
      style={{
        marginLeft: `${Math.max(0, leftPct)}%`,
        width: `${Math.min(100 - leftPct, widthPct)}%`,
        minWidth: '24px'
      }}
      title={`${job.job_code} (${deptInfo.shortName}): ${formatTime(job.start_time || job.planned_start)} - ${formatTime(job.end_time || job.planned_end)}`}
    >
      <span className="font-bold text-[8.5px] shrink-0 opacity-90">
        {deptInfo.shortName}
      </span>
      <span className="truncate font-mono">
        {job.job_code}
      </span>
    </div>
  );
};
