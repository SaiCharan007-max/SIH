import React from 'react';
import { ArrowRight, Database, Award, Cpu, CalendarCheck } from 'lucide-react';

export const PlanningPipelineBanner = () => {
  const stages = [
    {
      title: 'Maintenance Data',
      desc: 'Civil, TRD & S&T work orders',
      icon: Database,
      color: 'text-slate-300',
    },
    {
      title: 'Priority Engine',
      desc: 'Multi-attribute risk & urgency',
      icon: Award,
      color: 'text-amber-400',
    },
    {
      title: 'Constraint Optimizer',
      desc: 'CP-SAT headway & corridor solver',
      icon: Cpu,
      color: 'text-cyan-400',
    },
    {
      title: 'Proposed Block Plan',
      desc: 'Bundled, conflict-free possessions',
      icon: CalendarCheck,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col lg:flex-row items-center justify-between gap-4">
      {/* Pipeline Stages */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <React.Fragment key={stage.title}>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                <Icon className={`w-4 h-4 ${stage.color} shrink-0`} />
                <div>
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {stage.title}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
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

      {/* Explanatory text */}
      <div className="text-[11px] text-slate-400 max-w-sm lg:text-right border-t lg:border-t-0 lg:border-l border-slate-800 pt-2 lg:pt-0 lg:pl-4">
        <span className="font-semibold text-slate-300">Decision-Support Framework: </span>
        Priority scoring identifies what matters most. Constraint optimization determines when the work can feasibly occur.
      </div>
    </div>
  );
};
