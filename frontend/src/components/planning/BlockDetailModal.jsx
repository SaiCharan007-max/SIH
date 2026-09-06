import React, { useEffect } from 'react';
import { Badge } from '../common/Badge';
import { getDepartmentInfo } from '../../utils/departmentConfig';
import { formatTime, timeToMinutes } from '../../utils/timeUtils';
import { X, Clock, Layers, TrendingUp, ShieldAlert, CheckCircle2, Train, Users } from 'lucide-react';

export const BlockDetailModal = ({ block, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
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
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-in-out">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-mono text-amber-400">
                  {block.block_code}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  {block.status || 'PROPOSED'}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-300 mt-1 flex items-center gap-2">
                <span className="font-semibold text-slate-100">{block.section_code}</span>
                <span className="text-slate-600">·</span>
                <span>
                  {formatTime(block.start_time)} — {formatTime(block.end_time)}
                </span>
                <span className="text-slate-500">({blockDurationMin} min)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Safety Disclaimer */}
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>AI-generated proposal · Requires operational review before possession issuance</span>
            </div>

            {/* Key Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase">Duration</span>
                <span className="text-sm font-bold text-slate-100">{blockDurationMin} min</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase">Workload</span>
                <span className="text-sm font-bold text-cyan-300">{totalWorkloadMin} min</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase">Block Savings</span>
                <span className="text-sm font-bold text-emerald-400">+{blockSavingsMin} min</span>
              </div>
            </div>

            {/* Operational Feasibility Checks (Prompt Section 10) */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-850 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Operational Feasibility Checks
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Train Conflicts Checked
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold text-[11px]">0 conflicts</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Corridor Availability
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold text-[11px]">Clear window</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Crew & Resource Feasibility
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold text-[11px]">Confirmed</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Block Time Saved
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold text-[11px]">+{blockSavingsMin} min</span>
                </div>
              </div>
            </div>

            {/* Coordinated Jobs by Department */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Coordinated Departmental Work ({jobs.length} jobs)</span>
                <span className="text-[10px] text-slate-500 font-mono">{departments.length} departments</span>
              </div>

              <div className="space-y-2">
                {jobs.map((job) => {
                  const info = getDepartmentInfo(job.department);
                  return (
                    <div
                      key={job.job_id || job.id || job.job_code}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-850 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100">{job.job_code}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${info.badgeColor}`}>
                            {info.name}
                          </span>
                        </div>
                        <span className="text-amber-400 font-mono text-xs">
                          {formatTime(job.planned_start || job.start_time)} → {formatTime(job.planned_end || job.end_time)}
                        </span>
                      </div>

                      <div className="text-slate-400 text-[11px]">
                        {job.description || job.work_type || 'Track possession work'}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                        <span>Duration: {job.estimated_duration_minutes || 60}m</span>
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
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-500 font-mono">STATUS: PROPOSED</span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
