import React, { useState, useEffect } from 'react';
import { JobFilters } from '../components/maintenance/JobFilters';
import { JobDetailPanel } from '../components/maintenance/JobDetailPanel';
import { EmptyState } from '../components/common/EmptyState';
import { getMaintenancePriorities, getSections } from '../services/api';
import { Wrench, RefreshCw, AlertTriangle, ArrowUpDown, ChevronRight } from 'lucide-react';
import { getDepartmentInfo, PRIORITY_CONFIG } from '../utils/departmentConfig';
import { Badge } from '../components/common/Badge';

export const Maintenance = ({ planDate = '2026-09-10' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [sections, setSections] = useState([]);

  // Filters
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [criticality, setCriticality] = useState('');
  const [search, setSearch] = useState('');

  // Selected job for detail side drawer
  const [selectedJob, setSelectedJob] = useState(null);

  const loadMaintenanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [prioritiesData, sectionsData] = await Promise.all([
        getMaintenancePriorities({
          reference_date: planDate,
          department: department || undefined,
        }),
        getSections(),
      ]);

      setJobs(prioritiesData || []);
      setSections(sectionsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load maintenance work orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaintenanceData();
  }, [planDate, department]);

  const handleResetFilters = () => {
    setDepartment('');
    setSection('');
    setStatus('');
    setPriority('');
    setCriticality('');
    setSearch('');
  };

  // Client-side filtering
  const filteredJobs = jobs.filter((j) => {
    if (section && j.section_code !== section && j.section_id !== section) return false;
    if (status && j.status !== status) return false;
    if (priority && j.priority_level !== priority) return false;
    if (criticality && (j.criticality || 0) < Number(criticality)) return false;
    if (search) {
      const q = search.toLowerCase();
      const code = (j.job_code || '').toLowerCase();
      const desc = (j.description || '').toLowerCase();
      const asset = (j.asset_code || '').toLowerCase();
      const sec = (j.section_code || '').toLowerCase();
      const wt = (j.work_type || '').toLowerCase();
      if (!code.includes(q) && !desc.includes(q) && !asset.includes(q) && !sec.includes(q) && !wt.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              Maintenance Work
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {filteredJobs.length} work order{filteredJobs.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Prioritized maintenance requiring planning attention
          </p>
        </div>

        <button
          onClick={loadMaintenanceData}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
          title="Refresh priority work queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Compact Filters Toolbar */}
      <JobFilters
        department={department}
        setDepartment={setDepartment}
        section={section}
        setSection={setSection}
        status={status}
        setStatus={setStatus}
        priority={priority}
        setPriority={setPriority}
        criticality={criticality}
        setCriticality={setCriticality}
        search={search}
        setSearch={setSearch}
        sections={sections}
        onReset={handleResetFilters}
      />

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* High-Quality Data Table with Exact Required Columns */}
      {loading ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 animate-pulse space-y-3">
          <div className="h-6 bg-slate-800 rounded w-1/4" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-800/60 rounded" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No Matching Maintenance Work"
          description="No prioritized maintenance jobs meet the active filter constraints."
          action={
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider select-none">
                <tr>
                  <th className="py-3 px-3 text-center w-24">Priority</th>
                  <th className="py-3 px-3">Job</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Asset</th>
                  <th className="py-3 px-3">Section</th>
                  <th className="py-3 px-3 font-sans">Work Type</th>
                  <th className="py-3 px-3 text-right">Duration</th>
                  <th className="py-3 px-3">Deadline</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredJobs.map((j) => {
                  const dept = getDepartmentInfo(j.department);
                  const pInfo = PRIORITY_CONFIG[j.priority_level] || PRIORITY_CONFIG.MEDIUM;
                  const scoreFormatted =
                    typeof j.priority_score === 'number'
                      ? j.priority_score.toFixed(1)
                      : j.priority_score || '--';

                  return (
                    <tr
                      key={j.job_id || j.id || j.job_code}
                      onClick={() => setSelectedJob(j)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Priority Score with strong visual hierarchy */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`px-2 py-1 rounded font-bold text-xs border ${pInfo.badgeColor}`}
                          >
                            {scoreFormatted}
                          </span>
                        </div>
                      </td>

                      {/* Job Code */}
                      <td className="py-3 px-3 font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                        {j.job_code}
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${dept.badgeColor}`}
                        >
                          {dept.shortName}
                        </span>
                      </td>

                      {/* Asset */}
                      <td className="py-3 px-3 text-cyan-300 font-semibold">
                        {j.asset_code || 'TRACK'}
                      </td>

                      {/* Section */}
                      <td className="py-3 px-3 text-slate-300">
                        {j.section_code || '--'}
                      </td>

                      {/* Work Type */}
                      <td className="py-3 px-3 text-slate-300 font-sans text-xs">
                        {j.work_type || 'Track Maintenance'}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 text-right font-bold text-slate-200">
                        {j.duration_minutes || j.estimated_duration_minutes || 60} min
                      </td>

                      {/* Deadline */}
                      <td className="py-3 px-3 text-[11px]">
                        {j.deadline ? (
                          <span
                            className={j.overdue_days > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}
                          >
                            {j.deadline.slice(0, 10)}
                            {j.overdue_days > 0 && ` (+${j.overdue_days}d)`}
                          </span>
                        ) : (
                          <span className="text-slate-500">Open</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <Badge variant={j.status?.toLowerCase() || 'default'} size="xs">
                          {j.status || 'PENDING'}
                        </Badge>
                      </td>

                      {/* Arrow indicator */}
                      <td className="py-3 px-2 text-right text-slate-600 group-hover:text-slate-300 transition-colors">
                        <ChevronRight className="w-4 h-4 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row detail slide drawer */}
      <JobDetailPanel
        job={selectedJob}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
};
