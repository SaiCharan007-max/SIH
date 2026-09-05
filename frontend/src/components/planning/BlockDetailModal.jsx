import React, { useEffect } from 'react';
import { Badge } from '../common/Badge';
import { getDepartmentInfo } from '../../utils/departmentConfig';
import { formatTime, timeToMinutes } from '../../utils/timeUtils';
import { X, Clock, Layers, TrendingUp, ShieldAlert, Wrench, CheckCircle2 } from 'lucide-react';

export const BlockDetailModal = ({ block, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !block) return null;

  const jobs = block.jobs || [];
  const startMin = timeToMinutes(block.start_time);
  const endMin = timeToMinutes(block.end_time);
  const blockDurationMin = Math.max(0, endMin - startMin);

  let totalWorkloadMin = 0;
  for (const j of jobs) {
    const js = timeToMinutes(j.start_time || j.planned_start);
    const je = timeToMinutes(j.end_time || j.planned_end);
    totalWorkloadMin += (je - js);
  }

  const blockSavingsMin = Math.max(0, totalWorkloadMin - blockDurationMin);
  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over side panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-mono text-amber-400">
                  {block.block_code}
                </span>
                <Badge variant="proposed" size="xs">
                  {block.status || 'PROPOSED'}
                </Badge>
              </div>
              <div className="text-xs font-mono text-slate-300 mt-1 flex items-center gap-2">
                <span className="font-bold text-slate-100">{block.section_code}</span>
                <span className="text-slate-500">·</span>
                <span>
                  {formatTime(block.start_time)} — {formatTime(block.end_time)}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Safety Review Notice */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                AI-generated proposal · Requires operational review and chief controller verification before possession issuance.
              </span>
            </div>

            {/* Core Operational Metrics */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                  Duration
                </span>
                <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                  {blockDurationMin} min
                </div>
                <span className="text-[10px] text-slate-500">Track blocked</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                  Workload
                </span>
                <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                  {totalWorkloadMin} min
                </div>
                <span className="text-[10px] text-slate-500">Maint. performed</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                  Savings
                </span>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  {blockSavingsMin} min
                </div>
                <span className="text-[10px] text-emerald-500/80">Bundling gain</span>
              </div>
            </div>

            {/* Participating Departments */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Participating Departments ({departments.length})
              </div>
              <div className="space-y-1.5">
                {departments.map((dept) => {
                  const info = getDepartmentInfo(dept);
                  return (
                    <div
                      key={dept}
                      className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${info.badgeColor.split(' ')[0]}`} />
                        <span className="text-xs font-medium text-slate-200">{info.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {jobs.filter((j) => j.department === dept).length} job(s)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coordinated Jobs Breakdown */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Coordinated Jobs ({jobs.length})</span>
                <span className="text-[10px] text-emerald-400 font-normal">Single corridor window</span>
              </div>
              <div className="space-y-2">
                {jobs.map((job) => {
                  const info = getDepartmentInfo(job.department);
                  const dur = timeToMinutes(job.planned_end || job.end_time) - timeToMinutes(job.planned_start || job.start_time);
                  return (
                    <div
                      key={job.job_id || job.id || job.job_code}
                      className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-100">
                            {job.job_code}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${info.badgeColor}`}
                          >
                            {info.shortName}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-amber-300">
                          {formatTime(job.planned_start || job.start_time)} → {formatTime(job.planned_end || job.end_time)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Duration: {dur > 0 ? dur : job.estimated_duration_minutes || '-'} min</span>
                        {job.criticality && (
                          <span className="text-amber-400">Criticality: {job.criticality}/10</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">STATUS: PROPOSED</span>
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
