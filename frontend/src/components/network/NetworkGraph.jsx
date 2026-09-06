import React from 'react';
import { TrainTrack, MapPin } from 'lucide-react';

export const NetworkGraph = ({
  stations = [],
  sections = [],
  selectedSectionId,
  onSelectSection,
}) => {
  // Logical coordinates for Delhi division sample network
  const stationPositions = {
    'FIC-STN-A': { x: 14, y: 50 },
    'FIC-STN-B': { x: 38, y: 50 },
    'FIC-STN-C': { x: 68, y: 28 },
    'FIC-STN-D': { x: 68, y: 72 },
    'FIC-STN-E': { x: 90, y: 72 },
  };

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl relative overflow-hidden select-none min-h-[380px] flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <TrainTrack className="w-4 h-4 text-amber-400" />
            Schematic Network Topology
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a corridor section or station node to inspect assets, track specs, and scheduled maintenance
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-slate-500 inline-block" />
            <span>Double Track</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-b border-dashed border-slate-500 inline-block" />
            <span>Single Track</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span className="text-amber-400 font-semibold">Selected</span>
          </div>
        </div>
      </div>

      {/* Interactive Schematic Canvas */}
      <div className="relative w-full h-72 my-auto">
        <svg className="w-full h-full absolute inset-0 overflow-visible">
          {sections.map((sec) => {
            const fromPos = stationPositions[sec.from_station_code] || { x: 20, y: 50 };
            const toPos = stationPositions[sec.to_station_code] || { x: 80, y: 50 };
            const isSelected = sec.id === selectedSectionId;

            return (
              <g
                key={sec.id}
                className="cursor-pointer group"
                onClick={() => onSelectSection && onSelectSection(sec)}
              >
                {/* Wide invisible click target */}
                <line
                  x1={`${fromPos.x}%`}
                  y1={`${fromPos.y}%`}
                  x2={`${toPos.x}%`}
                  y2={`${toPos.y}%`}
                  stroke="transparent"
                  strokeWidth="28"
                />
                {/* Outer halo if selected */}
                {isSelected && (
                  <line
                    x1={`${fromPos.x}%`}
                    y1={`${fromPos.y}%`}
                    x2={`${toPos.x}%`}
                    y2={`${toPos.y}%`}
                    className="stroke-amber-400/25 stroke-[10]"
                  />
                )}
                {/* Track Edge Line */}
                <line
                  x1={`${fromPos.x}%`}
                  y1={`${fromPos.y}%`}
                  x2={`${toPos.x}%`}
                  y2={`${toPos.y}%`}
                  className={`transition-all ${
                    isSelected
                      ? 'stroke-amber-400 stroke-[4]'
                      : 'stroke-slate-700 hover:stroke-slate-400 stroke-[3]'
                  }`}
                  strokeDasharray={sec.track_count > 1 ? 'none' : '5 4'}
                />
                {/* Section Badge / Tag */}
                <g
                  transform={`translate(0, 0)`}
                  className="transition-transform group-hover:scale-105"
                >
                  <text
                    x={`${(fromPos.x + toPos.x) / 2}%`}
                    y={`${(fromPos.y + toPos.y) / 2 - 8}%`}
                    className={`text-[11px] font-mono font-bold transition-all ${
                      isSelected ? 'fill-amber-400' : 'fill-slate-300 group-hover:fill-slate-100'
                    }`}
                    textAnchor="middle"
                  >
                    {sec.section_code}
                  </text>
                  <text
                    x={`${(fromPos.x + toPos.x) / 2}%`}
                    y={`${(fromPos.y + toPos.y) / 2 + 14}%`}
                    className="text-[10px] font-mono fill-slate-500"
                    textAnchor="middle"
                  >
                    {sec.length_km}km · {sec.track_count > 1 ? 'Double' : 'Single'}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Station Nodes */}
        {stations.map((stn) => {
          const pos = stationPositions[stn.code] || { x: 50, y: 50 };
          return (
            <div
              key={stn.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 select-none group cursor-pointer"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => {
                // Find first section connected to this station
                const connectedSec = sections.find(
                  (s) => s.from_station_code === stn.code || s.to_station_code === stn.code
                );
                if (connectedSec && onSelectSection) {
                  onSelectSection(connectedSec);
                }
              }}
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-blue-500 group-hover:border-amber-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-all">
                <MapPin className="w-4 h-4 text-blue-400 group-hover:text-amber-400" />
              </div>
              <span className="font-mono font-bold text-[11px] text-slate-200 group-hover:text-amber-300 mt-1.5 px-2 py-0.5 rounded bg-slate-950/90 border border-slate-800">
                {stn.code}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[100px] text-center mt-0.5">
                {stn.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>Network Infrastructure: {stations.length} Stations &bull; {sections.length} Corridors &bull; 25kV AC Electrification</span>
        <span className="font-mono text-slate-500">Click section edge to inspect detailed assets &amp; maintenance</span>
      </div>
    </div>
  );
};
