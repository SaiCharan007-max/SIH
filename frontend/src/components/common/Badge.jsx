import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  }[size] || 'px-2 py-0.5 text-xs';

  const variantClasses = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    proposed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    superseded: 'bg-slate-700/20 text-slate-400 border-slate-600/40 line-through',
    failed: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    critical: 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-semibold',
    high: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    medium: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    engineering: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    traction: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    signal: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    moved: 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-medium',
    unchanged: 'bg-slate-800 text-slate-400 border-slate-700',
    newly_scheduled: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
  }[variant] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono tracking-tight rounded-md border ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
