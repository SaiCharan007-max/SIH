import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export const DisruptionModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  sections = [],
  currentPlan
}) => {
  const [eventType, setEventType] = useState('MAINTENANCE_OVERRUN');

  // Form states
  const [selectedSection, setSelectedSection] = useState(sections[0]?.id || '');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [actualEndTime, setActualEndTime] = useState('15:00');
  const [delayEntryTime, setDelayEntryTime] = useState('15:10');
  const [delayExitTime, setDelayExitTime] = useState('15:30');
  const [description, setDescription] = useState('');

  // Extract all scheduled jobs from currentPlan blocks
  const scheduledJobs = [];
  if (currentPlan?.blocks) {
    for (const b of currentPlan.blocks) {
      for (const j of b.jobs || []) {
        scheduledJobs.push({
          ...j,
          block_code: b.block_code,
          section_id: b.section_id
        });
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    let eventPayload = {
      event_type: eventType,
      section_id: selectedSection || sections[0]?.id,
      description: description || `Simulated ${eventType}`
    };

    if (eventType === 'MAINTENANCE_OVERRUN') {
      const targetJob = scheduledJobs.find((j) => (j.job_id || j.id) === selectedJobId) || scheduledJobs[0];
      eventPayload = {
        ...eventPayload,
        job_id: targetJob?.job_id || targetJob?.id,
        section_id: targetJob?.section_id || selectedSection,
        old_value: { planned_end: targetJob?.end_time || targetJob?.planned_end || '14:00' },
        new_value: { actual_end: actualEndTime },
        description: description || `Track welding delay on ${targetJob?.job_code || 'JOB'}`
      };
    } else if (eventType === 'TRAIN_DELAY') {
      eventPayload = {
        ...eventPayload,
        section_id: selectedSection || sections[0]?.id,
        old_value: { entry_time: '14:30', exit_time: '14:50' },
        new_value: { entry_time: delayEntryTime, exit_time: delayExitTime },
        description: description || 'Late arrival of connecting passenger train'
      };
    } else if (eventType === 'TRAIN_CANCELLATION') {
      eventPayload = {
        ...eventPayload,
        section_id: selectedSection || sections[0]?.id,
        description: description || 'Passenger train cancellation freeing corridor slot'
      };
    } else if (eventType === 'EMERGENCY_MAINTENANCE') {
      eventPayload = {
        ...eventPayload,
        section_id: selectedSection || sections[0]?.id,
        description: description || 'Emergency OHE dropper detachment repair (Criticality 10)'
      };
    } else if (eventType === 'CORRIDOR_RESTRICTION_CHANGE') {
      eventPayload = {
        ...eventPayload,
        section_id: selectedSection || sections[0]?.id,
        new_value: { start_time: '16:00', end_time: '17:30' },
        description: description || 'Temporary speed and corridor possession restriction'
      };
    }

    onSubmit(eventPayload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate Disruption & Replan"
      subtitle="Trigger a perturbation event to demonstrate dynamic incremental re-optimization"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Disruption Type Selector */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">
            Disruption Type
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
          >
            <option value="MAINTENANCE_OVERRUN">Maintenance Job Overrun</option>
            <option value="TRAIN_DELAY">Train Movement Delay</option>
            <option value="TRAIN_CANCELLATION">Train Cancellation (Capacity Opened)</option>
            <option value="EMERGENCY_MAINTENANCE">Emergency Unscheduled Work (Priority 10)</option>
            <option value="CREW_UNAVAILABLE">Crew Unavailability</option>
            <option value="CORRIDOR_RESTRICTION_CHANGE">Corridor Restriction Imposed</option>
          </select>
        </div>

        {/* Dynamic Fields for MAINTENANCE_OVERRUN */}
        {eventType === 'MAINTENANCE_OVERRUN' && (
          <div className="space-y-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1">
                Target Scheduled Maintenance Job
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
              >
                {scheduledJobs.map((j) => (
                  <option key={j.job_id || j.id} value={j.job_id || j.id}>
                    {j.job_code} ({j.department}) &mdash; planned end {j.end_time || j.planned_end}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                New Actual End Time (Extended)
              </label>
              <input
                type="time"
                value={actualEndTime}
                onChange={(e) => setActualEndTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Impact analysis will freeze unaffected jobs and re-optimize dependent jobs.
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Fields for TRAIN_DELAY */}
        {eventType === 'TRAIN_DELAY' && (
          <div className="space-y-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1">Affected Railway Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.section_code} ({s.from_station_code} &rarr; {s.to_station_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Delayed Entry</label>
                <input
                  type="time"
                  value={delayEntryTime}
                  onChange={(e) => setDelayEntryTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Delayed Exit</label>
                <input
                  type="time"
                  value={delayExitTime}
                  onChange={(e) => setDelayExitTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Description Field */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">
            Reason / Controller Remark (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Crew reported delay in rail thermite welding"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Generate Revised Plan</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
