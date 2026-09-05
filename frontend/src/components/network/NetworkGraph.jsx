import React, { useState } from 'react';
import { TrainTrack, Zap, MapPin, Network, GitFork } from 'lucide-react';

export const NetworkGraph = ({
  stations = [],
  sections = [],
  selectedSectionId,
  onSelectSection,
}) => {
  const [viewMode, setViewMode] = useState('diagram'); // 'diagram' | 'tree'

  // Logical coordinates for Delhi division sample network
  const stationPositions = {
    'FIC-STN-A': { x: 12, y: 50 },
    'FIC-STN-B': { x: 38, y: 50 },
    'FIC-STN-C': { x: 68, y: 25 },
    'FIC-STN-D': { x: 68, y: 75 },
    'FIC-STN-E': { x: 92, y: 75 },
  };

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl relative overflow-hidden select-none min-h-[380px] flex flex-col justify-between">
      {/* Header & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <TrainTrack className="w-4 h-4 text-amber-400" />
            Logical Railway Network Graph
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any corridor section edge or station to inspect physical assets and active maintenance blocks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('diagram')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'diagram'
                  ? 'bg-slate-800 text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Schematic View
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'tree'
                  ? 'bg-slate-800 text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Logical Graph Tree
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'diagram' ? (
        /* Interactive Schematic Canvas */
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
                    strokeWidth="24"
                  />
                  {/* Outer glow if selected */}
                  {isSelected && (
                    <line
                      x1={`${fromPos.x}%`}
                      y1={`${fromPos.y}%`}
                      x2={`${toPos.x}%`}
                      y2={`${toPos.y}%`}
                      className="stroke-amber-400/30 stroke-[8]"
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
                        : 'stroke-slate-700 hover:stroke-slate-500 stroke-[3]'
                    }`}
                    strokeDasharray={sec.track_count > 1 ? 'none' : '4 4'}
                  />
                  {/* Section Label */}
                  <text
                    x={`${(fromPos.x + toPos.x) / 2}%`}
                    y={`${(fromPos.y + toPos.y) / 2 - 4}%`}
                    className={`text-[11px] font-mono font-bold transition-all ${
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

          {/* Station Nodes */}
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
      ) : (
        /* Logical Railway Graph Tree Representation */
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-xs my-auto space-y-2">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Corridor Hierarchy & Junction Connections:
          </div>

          <div className="space-y-1 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold">FIC-STN-A (Delhi Jn)</span>
            </div>
            <div className="text-slate-600 pl-4 leading-none">│</div>
            <div className="flex items-center gap-2 pl-4">
              <span className="text-slate-500">├──</span>
              <button
                onClick={() => {
                  const sec = sections.find((s) => s.section_code === 'SEC-A-B');
                  if (sec) onSelectSection(sec);
                }}
                className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer font-bold"
              >
                Section SEC-A-B (12.5 km · 2 Tracks)
              </button>
              <span className="text-slate-500">──</span>
              <span className="text-blue-400 font-bold">FIC-STN-B (Ghaziabad)</span>
            </div>
            <div className="text-slate-600 pl-40 leading-none">│</div>
            <div className="flex items-center gap-2 pl-40">
              <span className="text-slate-500">├──</span>
              <button
                onClick={() => {
                  const sec = sections.find((s) => s.section_code === 'SEC-B-C');
                  if (sec) onSelectSection(sec);
                }}
                className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-pointer font-bold"
              >
                Section SEC-B-C (18.2 km · 1 Track)
              </button>
              <span className="text-slate-500">──</span>
              <span className="text-blue-400 font-bold">FIC-STN-C (Meerut City)</span>
            </div>
            <div className="text-slate-600 pl-40 leading-none">│</div>
            <div className="flex items-center gap-2 pl-40">
              <span className="text-slate-500">└──</span>
              <button
                onClick={() => {
                  const sec = sections.find((s) => s.section_code === 'SEC-B-D');
                  if (sec) onSelectSection(sec);
                }}
                className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 cursor-pointer font-bold"
              >
                Section SEC-B-D (14.0 km · 2 Tracks)
              </button>
              <span className="text-slate-500">──</span>
              <span className="text-blue-400 font-bold">FIC-STN-D (Aligarh Jn)</span>
            </div>
            <div className="text-slate-600 pl-80 leading-none">│</div>
            <div className="flex items-center gap-2 pl-80">
              <span className="text-slate-500">└──</span>
              <button
                onClick={() => {
                  const sec = sections.find((s) => s.section_code === 'SEC-D-E');
                  if (sec) onSelectSection(sec);
                }}
                className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-pointer font-bold"
              >
                Section SEC-D-E (20.5 km · 2 Tracks)
              </button>
              <span className="text-slate-500">──</span>
              <span className="text-blue-400 font-bold">FIC-STN-E (Kanpur Central)</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>Topology: 5 Stations &bull; 4 Track Corridor Sections &bull; 25kV Electrified Single/Double Lines</span>
        <span className="font-mono">Logical Railway Graph &bull; Stations = Nodes &bull; Sections = Connections</span>
      </div>
    </div>
  );
};
