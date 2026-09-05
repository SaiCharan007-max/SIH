import React from 'react';
import { Train } from 'lucide-react';
import { calculateTimelinePosition, formatTime } from '../../utils/timeUtils';

export const TimelineTrain = ({ train, onClick }) => {
  const { leftPct, widthPct } = calculateTimelinePosition(
    train.entry_time,
    train.exit_time
  );

  const isFreight = train.train_type === 'FREIGHT' || train.train_number?.startsWith('FRT') || train.movement_type === 'FREIGHT';

  const bgClasses = isFreight
    ? 'bg-slate-700/80 hover:bg-slate-600/90 text-slate-200 border-slate-600'
    : 'bg-blue-600/80 hover:bg-blue-500/90 text-blue-100 border-blue-400/50';

  return (
    <div
      className={`absolute top-1 bottom-1 rounded-md border text-[10px] font-mono px-1.5 flex items-center gap-1 shadow-sm cursor-pointer transition-all z-10 select-none overflow-hidden ${bgClasses}`}
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        minWidth: '28px'
      }}
      onClick={() => onClick && onClick(train)}
      title={`Train: ${train.train_number || 'TRN'} (${formatTime(train.entry_time)} - ${formatTime(train.exit_time)})`}
    >
      <Train className="w-3 h-3 shrink-0 opacity-80" />
      <span className="font-semibold truncate">
        {train.train_number || 'TRN'}
      </span>
      <span className="opacity-75 text-[9px] hidden sm:inline ml-auto">
        {formatTime(train.entry_time)}
      </span>
    </div>
  );
};
