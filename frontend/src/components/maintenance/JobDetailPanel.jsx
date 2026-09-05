import React, { useEffect } from 'react';
import { X, Wrench, AlertTriangle, Clock, Calendar, ShieldCheck, MapPin, Zap } from 'lucide-react';
import { getDepartmentInfo, PRIORITY_CONFIG } from '../../utils/departmentConfig';
import { Badge } from '../common/Badge';

export const JobDetailPanel = ({ job, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !job) return null;

  const deptInfo = getDepartmentInfo(job.department);
  const pConfig = PRIORITY_CONFIG[job.priority_level] || PRIORITY_CONFIG.MEDIUM;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-mono text-slate-100">
                  {job.job_code}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${deptInfo.badgeColor}`}>
                  {deptInfo.shortName}
                </span>
                <Badge variant={job.status?.toLowerCase() || 'default'} size="xs">
                  {job.status || 'PENDING'}
                </Badge>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                {deptInfo.name}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Priority Scorecard with strong visual hierarchy */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Priority Engine Score
                </span>
                <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${pConfig.badgeColor}`}>
                  {job.priority_level || 'MEDIUM'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-extrabold font-mono text-amber-400">
                  {typeof job.priority_score === 'number' ? job.priority_score.toFixed(1) : job.priority_score || '--'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">/ 100 max rank score</div>
              </div>

              {/* Attributes Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block uppercase">Criticality</span>
                  <span className="text-sm font-bold text-amber-400">{job.criticality || '--'}</span>
                  <span className="text-[9px] text-slate-500 block">/ 10</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block uppercase">Urgency</span>
                  <span className="text-sm font-bold text-slate-200">{job.urgency || '--'}</span>
                  <span className="text-[9px] text-slate-500 block">/ 5</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-[9px] text-slate-500 block uppercase">Overdue</span>
                  <span className={`text-sm font-bold ${job.overdue_days > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {job.overdue_days > 0 ? `+${job.overdue_days}d` : '0d'}
                  </span>
                  <span className="text-[9px] text-slate-500 block">deadline</span>
                </div>
              </div>
            </div>

            {/* Work Description */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Work Scope & Description
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 leading-relaxed font-sans">
                {job.description || 'Routine scheduled track inspection and maintenance.'}
              </div>
            </div>

            {/* Infrastructure Location */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Railway Location & Asset
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">Section</span>
                  <span className="font-bold text-slate-200">{job.section_code || '--'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Asset Code</span>
                  <span className="font-bold text-cyan-300">{job.asset_code || 'TRACK'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Work Type</span>
                  <span className="text-slate-300 font-sans">{job.work_type || 'Track Maintenance'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Track Required</span>
                  <span className="text-slate-300">{job.requires_track_possession !== false ? 'Possession Required' : 'No possession'}</span>
                </div>
              </div>
            </div>

            {/* Schedule & Duration */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Time Constraints
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">Estimated Duration</span>
                  <span className="font-bold text-slate-100">
                    {job.duration_minutes || job.estimated_duration_minutes || 60} minutes
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Target Deadline</span>
                  <span className={`font-bold ${job.overdue_days > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {job.deadline ? job.deadline.slice(0, 10) : 'Open'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">SIH26027 Work Order</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
