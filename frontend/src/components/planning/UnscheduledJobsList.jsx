import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { getDepartmentInfo } from '../../utils/departmentConfig';
import { AlertCircle, Clock, ShieldAlert } from 'lucide-react';

export const UnscheduledJobsList = ({ unscheduledJobs = [] }) => {
  if (unscheduledJobs.length === 0) {
    return (
      <Card title="Unscheduled Maintenance Work" subtitle="Constraint conflict monitoring">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All eligible candidate maintenance jobs were successfully accommodated in feasible corridor blocks!</span>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={`Unscheduled Maintenance Work (${unscheduledJobs.length})`}
      subtitle="Jobs that could not be scheduled due to hard operational, crew, or corridor constraints"
      className="border-rose-950/40"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {unscheduledJobs.map((item) => {
          const dept = getDepartmentInfo(item.department);
          return (
            <div
              key={item.job_id || item.id}
              className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/50 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-slate-200">
                    {item.job_code || item.job_id?.slice(0, 8)}
                  </span>
                  <Badge variant={item.priority_level?.toLowerCase() || 'high'}>
                    {item.priority_level || 'HIGH'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${dept.badgeColor}`}>
                    {dept.shortName}
                  </span>
                  <span>&bull; {item.duration_minutes || item.estimated_duration_minutes || 60} mins</span>
                  {item.deadline && <span className="font-mono text-[10px]">Due: {item.deadline}</span>}
                </div>
              </div>

              {/* Diagnostic Refusal Reason */}
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 flex items-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-tight">
                  <span className="text-slate-400">Reason: </span>
                  <span className="font-mono font-semibold text-rose-300">
                    {item.reason || 'NO_FEASIBLE_WINDOW'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
