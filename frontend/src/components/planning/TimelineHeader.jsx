import React from 'react';

export const TimelineHeader = ({
  windowStart = '06:00',
  windowEnd = '22:00',
  stepHours = 2
}) => {
  const hours = [];
  for (let h = 6; h <= 22; h += stepHours) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }

  return (
    <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 py-2.5 px-4 flex items-center select-none">
      <div className="w-48 shrink-0 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
        Railway Section
      </div>
      <div className="flex-1 relative h-6">
        {hours.map((timeStr) => {
          // Calculate percentage from 06:00 (360) to 22:00 (1320)
          const [h, m] = timeStr.split(':').map(Number);
          const totalMin = h * 60 + m;
          const pct = ((totalMin - 360) / (1320 - 360)) * 100;

          return (
            <div
              key={timeStr}
              className="absolute top-0 flex flex-col items-center -translate-x-1/2"
              style={{ left: `${pct}%` }}
            >
              <span className="text-[10px] font-mono text-slate-400 font-medium">
                {timeStr}
              </span>
              <div className="w-px h-1.5 bg-slate-700 mt-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
