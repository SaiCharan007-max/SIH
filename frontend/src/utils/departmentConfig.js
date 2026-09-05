/**
 * Operational branding and visual tokens for Indian Railways infrastructure departments.
 */
export const DEPARTMENT_CONFIG = {
  ENGINEERING: {
    name: 'Civil Engineering',
    shortName: 'ENG',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    barColor: 'bg-amber-500',
    hoverBorder: 'hover:border-amber-400',
    textColor: 'text-amber-400',
    description: 'Track structure, sleepers, rails, ballast, points & crossings'
  },
  TRACTION_DISTRIBUTION: {
    name: 'Traction Distribution',
    shortName: 'TRD',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    barColor: 'bg-emerald-500',
    hoverBorder: 'hover:border-emerald-400',
    textColor: 'text-emerald-400',
    description: '25kV AC overhead equipment (OHE), substations, cantilevers'
  },
  SIGNAL_TELECOM: {
    name: 'Signal & Telecom',
    shortName: 'S&T',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    barColor: 'bg-purple-500',
    hoverBorder: 'hover:border-purple-400',
    textColor: 'text-purple-400',
    description: 'Colour light signals, point machines, track circuits, interlocking'
  }
};

export const getDepartmentInfo = (dept) => {
  const key = (dept || '').toUpperCase().trim();
  return DEPARTMENT_CONFIG[key] || {
    name: dept || 'Unknown',
    shortName: (dept || 'UNK').slice(0, 3),
    badgeColor: 'bg-slate-700/20 text-slate-300 border-slate-600',
    barColor: 'bg-slate-500',
    hoverBorder: 'hover:border-slate-400',
    textColor: 'text-slate-300',
    description: 'General railway maintenance'
  };
};

export const PRIORITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  },
  HIGH: {
    label: 'High',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  MEDIUM: {
    label: 'Medium',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  },
  LOW: {
    label: 'Low',
    badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  }
};
