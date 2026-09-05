import React from 'react';
import { ArrowRight, Database, Award, Cpu, FileCheck2 } from 'lucide-react';

export const PlanningPipelineBanner = () => {
  const stages = [
    {
      title: 'Maintenance Requests',
      desc: 'Raw engineering jobs',
      icon: Database,
      color: 'text-slate-300'
    },
    {
      title: 'Priority Engine',
      desc: 'Urgency & asset risk',
      icon: Award,
      color: 'text-amber-400'
    },
    {
      title: 'Constraint Optimizer',
      desc: 'OR-Tools CP-SAT',
      icon: Cpu,
      color: 'text-emerald-400'
    },
    {
      title: 'Proposed Block Plan',
      desc: 'Conflict-free windows',
      icon: FileCheck2,
      color: 'text-cyan-400'
    }
  ];

  return (
    <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Pipeline Stages */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <React.Fragment key={stage.title}>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <Icon className={`w-4 h-4 ${stage.color} shrink-0`} />
                <div>
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {stage.title}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {stage.desc}
                  </div>
                </div>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Technical Summary */}
      <div className="text-[11px] text-slate-400 max-w-xs md:text-right border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
        <span className="font-semibold text-slate-300">Planning Principle: </span>
        Priority scoring identifies which maintenance work matters most. Constraint optimization determines when that work can feasibly occur.
      </div>
    </div>
  );
};
