import React from 'react';
import { Badge } from '../common/Badge';
import { getDepartmentInfo, PRIORITY_CONFIG } from '../../utils/departmentConfig';
import { Clock, AlertCircle, Wrench, Shield, Calendar, Users } from 'lucide-react';

export const MaintenanceJobCard = ({ job }) => {
  const dept = getDepartmentInfo(job.department);
  const priorityInfo = PRIORITY_CONFIG[job.priority_level] || PRIORITY_CONFIG.MEDIUM;

  const scoreFormatted = typeof job.priority_score === 'number'
    ? job.priority_score.toFixed(1)
    : (job.priority_score || '--');

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-md shadow-black/20">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-100">
                {job.job_code}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${dept.badgeColor}`}>
                {dept.shortName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1" title={job.description}>
              {job.description || job.work_type || 'Track maintenance task'}
            </p>
          </div>

          {/* Prominent Priority Score */}
          <div className="text-right shrink-0">
            <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${priorityInfo.badgeColor}`}>
              <span>P-SCORE</span>
              <span className="text-sm">{scoreFormatted}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              Level: {job.priority_level || 'MEDIUM'}
            </span>
          </div>
        </div>

        {/* Core Attributes */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
          <div>
            <span className="text-slate-500">Section: </span>
            <span className="text-slate-300 font-semibold">{job.section_code || 'SEC'}</span>
          </div>
          <div>
            <span className="text-slate-500">Asset: </span>
            <span className="text-slate-300 font-semibold truncate block">{job.asset_code || 'Track'}</span>
          </div>
          <div>
            <span className="text-slate-500">Duration: </span>
            <span className="text-amber-300">{job.duration_minutes || job.estimated_duration_minutes || 60}m</span>
          </div>
          <div>
            <span className="text-slate-500">Crit/Urg: </span>
            <span className="text-slate-200">{job.criticality || '--'}/{job.urgency || '--'}</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-800/60 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>Due: {job.deadline ? job.deadline.slice(0, 10) : 'Open'}</span>
          {job.overdue_days > 0 && (
            <span className="text-rose-400 font-bold font-mono">+{job.overdue_days}d overdue</span>
          )}
        </div>

        <Badge variant={job.status?.toLowerCase() || 'default'} size="xs">
          {job.status || 'PENDING'}
        </Badge>
      </div>
    </div>
  );
};
