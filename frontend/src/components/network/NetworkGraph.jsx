import React from 'react';
import { TrainTrack, Zap, MapPin } from 'lucide-react';

export const NetworkGraph = ({
  stations = [],
  sections = [],
  selectedSectionId,
  onSelectSection
}) => {
  // Logical layout coordinates for demonstration stations A -> B -> C, B -> D -> E
  const stationPositions = {
    'FIC-STN-A': { x: 10, y: 50 },
    'FIC-STN-B': { x: 35, y: 50 },
    'FIC-STN-C': { x: 65, y: 25 },
    'FIC-STN-D': { x: 65, y: 75 },
    'FIC-STN-E': { x: 90, y: 75 }
  };

  return (
    <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl relative overflow-hidden select-none min-h-[380px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <TrainTrack className="w-4 h-4 text-amber-400" />
            Logical Railway Section Topology
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any railway section edge or station node to inspect assets and corridor windows
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-400" />
            Station Node
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-1 bg-amber-500 rounded" />
            Track Section Edge
          </span>
        </div>
      </div>

      {/* SVG Canvas for Track Edges */}
      <div className="relative w-full h-64 my-auto">
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
                {/* Wide invisible click zone */}
                <line
                  x1={`${fromPos.x}%`}
                  y1={`${fromPos.y}%`}
                  x2={`${toPos.x}%`}
                  y2={`${toPos.y}%`}
                  stroke="transparent"
                  strokeWidth="20"
                />
                {/* Track Edge Line */}
                <line
                  x1={`${fromPos.x}%`}
                  y1={`${fromPos.y}%`}
                  x2={`${toPos.x}%`}
                  y2={`${toPos.y}%`}
                  className={`transition-all ${
                    isSelected
                      ? 'stroke-amber-400 stroke-[4]'
                      : 'stroke-slate-700 hover:stroke-slate-500 stroke-[3]'
                  }`}
                  strokeDasharray={sec.track_count > 1 ? 'none' : '4 4'}
                />
                {/* Section Code Label in Middle */}
                <text
                  x={`${(fromPos.x + toPos.x) / 2}%`}
                  y={`${(fromPos.y + toPos.y) / 2 - 2}%`}
                  className={`text-[10px] font-mono font-bold transition-all ${
                    isSelected ? 'fill-amber-400' : 'fill-slate-400 group-hover:fill-slate-200'
                  }`}
                  textAnchor="middle"
                >
                  {sec.section_code} ({sec.length_km}km)
                </text>
              </g>
            );
          })}
        </svg>

        {/* Station Nodes HTML Overlays */}
        {stations.map((stn) => {
          const pos = stationPositions[stn.code] || { x: 50, y: 50 };
          return (
            <div
              key={stn.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 select-none group cursor-pointer"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-blue-500 group-hover:border-amber-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-all">
                <MapPin className="w-4 h-4 text-blue-400 group-hover:text-amber-400" />
              </div>
              <span className="font-mono font-bold text-[11px] text-slate-200 group-hover:text-amber-300 mt-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800">
                {stn.code}
              </span>
              <span className="text-[9px] text-slate-400 truncate max-w-[90px] text-center">
                {stn.name}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Topology: 5 Stations &bull; 4 Track Corridors &bull; 25kV Electrified Single/Double Lines</span>
        <span className="font-mono">SIH26027 Logical Infrastructure Model</span>
      </div>
    </div>
  );
};
