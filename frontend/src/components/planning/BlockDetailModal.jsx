import React from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { getDepartmentInfo } from '../../utils/departmentConfig';
import { formatTime, timeToMinutes } from '../../utils/timeUtils';
import { Layers, Clock, Award, ShieldCheck } from 'lucide-react';

export const BlockDetailModal = ({ block, isOpen, onClose }) => {
  if (!block) return null;

  const jobs = block.jobs || [];
  const startMin = timeToMinutes(block.start_time);
  const endMin = timeToMinutes(block.end_time);
  const blockDurationMin = Math.max(0, endMin - startMin);

  let totalMaintMin = 0;
  for (const j of jobs) {
    const js = timeToMinutes(j.start_time || j.planned_start);
    const je = timeToMinutes(j.end_time || j.planned_end);
    totalMaintMin += (je - js);
  }

  const savingsMin = Math.max(0, totalMaintMin - blockDurationMin);
  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Maintenance Block: ${block.block_code}`}
      subtitle={`Section: ${block.section_code || block.section_id}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Block Window</span>
            <div className="text-sm font-mono font-bold text-amber-300 mt-1">
              {formatTime(block.start_time)} - {formatTime(block.end_time)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">({blockDurationMin} mins)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Total Work Time</span>
            <div className="text-sm font-mono font-bold text-slate-200 mt-1">
              {totalMaintMin} mins
            </div>
            <span className="text-[10px] text-slate-500">{jobs.length} jobs combined</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Block Savings</span>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
              +{savingsMin} mins
            </div>
            <span className="text-[10px] text-emerald-500/80 font-mono">Track downtime saved</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Block Status</span>
            <div className="mt-1">
              <Badge variant={block.status?.toLowerCase() || 'proposed'}>
                {block.status || 'PROPOSED'}
              </Badge>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Decision-support</span>
          </div>
        </div>

        {/* Participating Departments */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            Participating Departments
          </h4>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => {
              const info = getDepartmentInfo(dept);
              return (
                <div
                  key={dept}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${info.badgeColor}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{info.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coordinated Jobs Table */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            Scheduled Jobs in this Block ({jobs.length})
          </h4>
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Job Code</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Scheduled Window</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Criticality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {jobs.map((j) => {
                  const dept = getDepartmentInfo(j.department);
                  return (
                    <tr key={j.job_id || j.id || j.job_code} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-semibold text-slate-200">
                        {j.job_code || j.id?.slice(0, 8)}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${dept.badgeColor}`}>
                          {dept.shortName}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {formatTime(j.start_time || j.planned_start)} &rarr; {formatTime(j.end_time || j.planned_end)}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {j.duration_minutes || j.estimated_duration_minutes || '--'}m
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-amber-400 font-bold">
                          {j.criticality || '--'}/10
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};
