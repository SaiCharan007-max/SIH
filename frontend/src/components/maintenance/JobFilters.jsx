import React from 'react';
import { Filter, Search } from 'lucide-react';

export const JobFilters = ({
  department,
  setDepartment,
  status,
  setStatus,
  search,
  setSearch
}) => {
  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Search Input */}
      <div className="relative min-w-[220px] flex-1">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by job code, asset, or section..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Select Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Department */}
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">All Departments</option>
          <option value="ENGINEERING">Civil Engineering (ENG)</option>
          <option value="TRACTION_DISTRIBUTION">Traction Distribution (TRD)</option>
          <option value="SIGNAL_TELECOM">Signal & Telecom (S&T)</option>
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="PLANNED">PLANNED</option>
          <option value="APPROVED">APPROVED</option>
        </select>
      </div>
    </div>
  );
};
