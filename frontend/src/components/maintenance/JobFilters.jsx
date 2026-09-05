import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

export const JobFilters = ({
  department,
  setDepartment,
  section,
  setSection,
  status,
  setStatus,
  priority,
  setPriority,
  criticality,
  setCriticality,
  search,
  setSearch,
  sections = [],
  onReset,
}) => {
  return (
    <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-2.5 text-xs">
      {/* Search Input */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by job code, asset, or work..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Filter Selects Group */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Department */}
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">Department: All</option>
          <option value="ENGINEERING">Civil Engineering (ENG)</option>
          <option value="TRACTION_DISTRIBUTION">Traction (TRD)</option>
          <option value="SIGNAL_TELECOM">Signal & Telecom (S&T)</option>
        </select>

        {/* Section */}
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
        >
          <option value="">Section: All</option>
          {sections.map((s) => (
            <option key={s.id} value={s.section_code || s.id}>
              {s.section_code}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">Status: All</option>
          <option value="PENDING">PENDING</option>
          <option value="PLANNED">PLANNED</option>
          <option value="APPROVED">APPROVED</option>
        </select>

        {/* Priority Level */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">Priority: All</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        {/* Criticality */}
        <select
          value={criticality}
          onChange={(e) => setCriticality(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">Criticality: All</option>
          <option value="8">Crit &ge; 8</option>
          <option value="5">Crit &ge; 5</option>
          <option value="1">Crit &ge; 1</option>
        </select>

        {/* Clear Filters */}
        {(department || section || status || priority || criticality || search) && (
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
