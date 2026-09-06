import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const PlanningPipelineBanner = ({
  totalJobs = 17,
  prioritizedCount = 17,
  scheduledCount = 15,
  blocksCount = 6,
}) => {
  const steps = [
    { label: 'Maintenance Requests', value: `${totalJobs} Jobs` },
    { label: 'Priority Engine', value: 'Multi-Attribute' },
    { label: 'Constraint Optimizer', value: 'Headway Feasible' },
    { label: 'Proposed Plan', value: `${blocksCount} Coordinated Blocks` },
  ];

  return (
    <div className="py-2.5 px-4 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
        <span className="text-slate-500 uppercase font-semibold tracking-wider text-[10px]">
          Planning Pipeline:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((s, idx) => (
            <React.Fragment key={s.label}>
              <span className="text-slate-200">
                {s.label}{' '}
                <span className="text-slate-400 font-normal">({s.value})</span>
              </span>
              {idx < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>Corridor Headway Verified</span>
      </div>
    </div>
  );
};
