import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle, Clock, RefreshCw, Zap, ShieldAlert } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'MAINTENANCE_OVERRUN', label: 'Maintenance Overrun' },
  { value: 'TRAIN_DELAY', label: 'Train Delay' },
  { value: 'TRAIN_CANCELLATION', label: 'Train Cancellation' },
  { value: 'EMERGENCY_MAINTENANCE', label: 'Emergency Maintenance' },
  { value: 'CREW_UNAVAILABLE', label: 'Crew Unavailable' },
  { value: 'CORRIDOR_RESTRICTION_CHANGE', label: 'Corridor Restriction' },
];

const PROCESSING_STEPS = [
  'Analyzing impact...',
  'Freezing unaffected work...',
  'Re-optimizing affected schedule...',
  'Validating revised plan...',
];

export const DisruptionModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  sections = [],
  currentPlan,
}) => {
  const [eventType, setEventType] = useState('MAINTENANCE_OVERRUN');

  // Form states
  const [selectedSection, setSelectedSection] = useState(sections[0]?.id || '');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [actualEndTime, setActualEndTime] = useState('15:00');
  const [delayEntryTime, setDelayEntryTime] = useState('15:10');
  const [delayExitTime, setDelayExitTime] = useState('15:30');
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [description, setDescription] = useState('');

  // Processing message index while loading
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (loading) {
      setStepIndex(0);
      interval = setInterval(() => {
        setStepIndex((prev) => (prev + 1) % PROCESSING_STEPS.length);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Extract scheduled jobs from currentPlan blocks
  const scheduledJobs = [];
  if (currentPlan?.blocks) {
    for (const b of currentPlan.blocks) {
      for (const j of b.jobs || []) {
        scheduledJobs.push({
          ...j,
          block_code: b.block_code,
          section_id: b.section_id,
        });
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    let eventPayload = {
      event_type: eventType,
      section_id: selectedSection || sections[0]?.id,
      description: description || `Simulated ${eventType}`,
    };

    if (eventType === 'MAINTENANCE_OVERRUN') {
      const targetJob =
        scheduledJobs.find((j) => (j.job_id || j.id) === selectedJobId) || scheduledJobs[0];
      eventPayload = {
        ...eventPayload,
        job_id: targetJob?.job_id || targetJob?.id,
        section_id: targetJob?.section_id || selectedSection,
        old_value: { planned_end: targetJob?.end_time || targetJob?.planned_end || '14:00' },
        new_value: { actual_end: actualEndTime },
        description: description || `Overrun on ${targetJob?.job_code || 'JOB'} until ${actualEndTime}`,
      };
    } else if (eventType === 'TRAIN_DELAY') {
      eventPayload = {
        ...eventPayload,
        section_id: selectedSection || sections[0]?.id,
        old_value: { entry_time: '14:30', exit_time: '14:50' },
        new_value: { entry_time: delayEntryTime, exit_time: delayExitTime },
        description: description || `Train delay of ${delayMinutes} min on corridor`,
      };
    } else if (eventType === 'TRAIN_CANCELLATION') {
      eventPayload = {
        ...eventPayload,
        section_id: selectedSection || sections[0]?.id,
        description: description || 'Scheduled movement cancelled, freeing corridor possession gap',
      };
    } else if (eventType === 'EMERGENCY_MAINTENANCE') {
      eventPayload = {
        ...eventPayload,
        section_id: selectedSection || sections[0]?.id,
        description: description || 'Emergency rail fracture/OHE breakdown requiring immediate slot',
      };
    } else if (eventType === 'CREW_UNAVAILABLE') {
      const targetJob =
        scheduledJobs.find((j) => (j.job_id || j.id) === selectedJobId) || scheduledJobs[0];
      eventPayload = {
        ...eventPayload,
        job_id: targetJob?.job_id || targetJob?.id,
        section_id: targetJob?.section_id || selectedSection,
        description: description || `Assigned engineering crew unavailable for ${targetJob?.job_code || 'JOB'}`,
      };
    } else if (eventType === 'CORRIDOR_RESTRICTION_CHANGE') {
      eventPayload = {
        ...eventPayload,
        section_id: selectedSection || sections[0]?.id,
        new_value: { start_time: '16:00', end_time: '17:30' },
        description: description || 'Emergency speed restriction or corridor possession restriction',
      };
    }

    onSubmit(eventPayload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate Operational Disruption"
      subtitle="Trigger an unscheduled perturbation to test CP-SAT dynamic replanning & schedule stability"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Disruption Type Selector */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">
            Operational Event Type
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-medium focus:border-amber-500 focus:outline-none"
          >
            {EVENT_TYPES.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Form Fields Based on Event Type */}
        {eventType === 'MAINTENANCE_OVERRUN' && (
          <div className="space-y-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Active Scheduled Job
              </label>
              {scheduledJobs.length === 0 ? (
                <div className="text-slate-500 italic">No scheduled jobs found in current plan.</div>
              ) : (
                <select
                  value={selectedJobId || scheduledJobs[0]?.job_id || scheduledJobs[0]?.id}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                >
                  {scheduledJobs.map((j) => (
                    <option key={j.job_id || j.id} value={j.job_id || j.id}>
                      {j.job_code} ({j.department}) — Block {j.block_code}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Actual End Time
              </label>
              <input
                type="time"
                value={actualEndTime}
                onChange={(e) => setActualEndTime(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Work extended past planned window; downstream traffic and blocks must adjust.
              </span>
            </div>
          </div>
        )}

        {eventType === 'TRAIN_DELAY' && (
          <div className="space-y-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Railway Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.section_code} ({s.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Revised Entry</label>
                <input
                  type="time"
                  value={delayEntryTime}
                  onChange={(e) => setDelayEntryTime(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Revised Exit</label>
                <input
                  type="time"
                  value={delayExitTime}
                  onChange={(e) => setDelayExitTime(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {(eventType === 'TRAIN_CANCELLATION' ||
          eventType === 'EMERGENCY_MAINTENANCE' ||
          eventType === 'CREW_UNAVAILABLE' ||
          eventType === 'CORRIDOR_RESTRICTION_CHANGE') && (
          <div className="space-y-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Target Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.section_code} ({s.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Disruption Details</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Operational remarks for ${eventType}...`}
                disabled={loading}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Processing Indicator during active request */}
        {loading && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            <div>
              <div className="font-semibold text-amber-300">
                {PROCESSING_STEPS[stepIndex]}
              </div>
              <div className="text-[10px] text-amber-400/80">
                Solving OR-Tools CP-SAT stability constraints...
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Generate Revised Plan</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
