import { timeToMinutes, extractTimeString } from './planning.service.js';

/**
 * Checks if two open intervals (s1, e1) and (s2, e2) overlap.
 */
const intervalsOverlap = (s1, e1, s2, e2) => s1 < e2 && e1 > s2;

/**
 * Analyzes disruption events and identifies affected sections, blocks, jobs, and time window.
 *
 * Supported Event Types:
 * - MAINTENANCE_OVERRUN: job takes longer than planned.
 * - TRAIN_DELAY: train entry/exit shifts later.
 * - TRAIN_CANCELLATION: train movement cancelled.
 * - EMERGENCY_MAINTENANCE: new emergency maintenance required.
 * - CREW_UNAVAILABLE: crew goes off-duty or unavailable.
 * - CORRIDOR_RESTRICTION_CHANGE: corridor restriction changed.
 *
 * @param {Object} currentPlan - Existing planning run with blocks and block jobs
 * @param {Object} event - The disruption event
 * @param {Object} snapshot - Current base planning snapshot
 * @returns {Object} Impact analysis result
 */
export const analyzeEventImpact = (currentPlan, event, snapshot) => {
  const affectedSections = new Set();
  const affectedBlocks = new Set();
  const affectedJobs = new Set();
  let windowStartMin = 1440;
  let windowEndMin = 0;

  const eventType = event.event_type;

  // Build lookup from base snapshot for crews and resources
  const snapshotJobMap = new Map();
  for (const j of snapshot?.jobs || []) {
    snapshotJobMap.set(j.job_id, j);
  }

  // Flatten all scheduled jobs from currentPlan blocks
  const scheduledJobMap = new Map();
  for (const block of currentPlan.blocks) {
    for (const j of block.jobs) {
      const snapJ = snapshotJobMap.get(j.job_id);
      const sStr = extractTimeString(j.start_time || j.planned_start);
      const eStr = extractTimeString(j.end_time || j.planned_end);
      scheduledJobMap.set(j.job_id, {
        ...j,
        block_id: block.id,
        block_code: block.block_code,
        section_id: block.section_id,
        crew_ids: snapJ?.crew_ids || [],
        resources: snapJ?.resources || [],
        department: snapJ?.department || j.department,
        start_time: sStr,
        end_time: eStr,
        startMin: timeToMinutes(sStr),
        endMin: timeToMinutes(eStr)
      });
    }
  }

  if (eventType === 'MAINTENANCE_OVERRUN') {
    // 1. Identify the overrunning job
    const jobId = event.job_id;
    const overrunningJob = scheduledJobMap.get(jobId);
    const newEndStr = event.new_value?.actual_end || event.new_value?.end_time;
    const newEndMin = newEndStr ? timeToMinutes(newEndStr) : (overrunningJob ? overrunningJob.endMin + 60 : 1440);

    if (overrunningJob) {
      affectedJobs.add(jobId);
      affectedSections.add(overrunningJob.section_id);
      affectedBlocks.add(overrunningJob.block_code);
      windowStartMin = Math.min(windowStartMin, overrunningJob.startMin);
      windowEndMin = Math.max(windowEndMin, newEndMin);

      // Find jobs that conflict with the extended overrun interval:
      // - Same section overlapping [overrunningJob.startMin, newEndMin]
      // - Sharing assigned/eligible crew overlapping [overrunningJob.startMin, newEndMin]
      // - Sharing any physical resource overlapping [overrunningJob.startMin, newEndMin]
      for (const [otherId, sj] of scheduledJobMap.entries()) {
        if (otherId !== jobId) {
          if (intervalsOverlap(sj.startMin, sj.endMin, overrunningJob.startMin, newEndMin)) {
            const sameSection = sj.section_id === overrunningJob.section_id;
            const sharesCrew =
              (overrunningJob.crew_ids.length > 0 && sj.crew_ids.length > 0 &&
                overrunningJob.crew_ids.some(cid => sj.crew_ids.includes(cid))) ||
              (overrunningJob.department && sj.department && overrunningJob.department === sj.department);
            const sharesResource = overrunningJob.resources.length > 0 && sj.resources.length > 0 &&
              overrunningJob.resources.some(r1 => sj.resources.some(r2 => r1.resource_name === r2.resource_name));

            if (sameSection || sharesCrew || sharesResource) {
              affectedJobs.add(otherId);
              affectedBlocks.add(sj.block_code);
              affectedSections.add(sj.section_id);
              windowStartMin = Math.min(windowStartMin, sj.startMin);
              windowEndMin = Math.max(windowEndMin, sj.endMin);
            }
          }
        }
      }
    } else if (event.section_id) {
      affectedSections.add(event.section_id);
      if (jobId) affectedJobs.add(jobId);
    }
  } else if (eventType === 'TRAIN_DELAY') {
    // Train shifted
    const sectionId = event.section_id;
    if (sectionId) affectedSections.add(sectionId);

    const newStartStr = event.new_value?.entry_time;
    const newEndStr = event.new_value?.exit_time;
    const delayStartMin = newStartStr ? timeToMinutes(newStartStr) : 0;
    const delayEndMin = newEndStr ? timeToMinutes(newEndStr) : 1440;

    windowStartMin = Math.min(windowStartMin, delayStartMin);
    windowEndMin = Math.max(windowEndMin, delayEndMin);

    // Find blocks overlapping new train interval
    for (const block of currentPlan.blocks) {
      if (block.section_id === sectionId) {
        const bStartMin = timeToMinutes(block.start_time);
        const bEndMin = timeToMinutes(block.end_time);
        if (intervalsOverlap(bStartMin, bEndMin, delayStartMin, delayEndMin)) {
          affectedBlocks.add(block.block_code);
          for (const j of block.jobs) {
            affectedJobs.add(j.job_id);
          }
        }
      }
    }
  } else if (eventType === 'TRAIN_CANCELLATION') {
    if (event.section_id) affectedSections.add(event.section_id);
    // Might unblock unscheduled jobs
    windowStartMin = 0;
    windowEndMin = 1440;
  } else if (eventType === 'EMERGENCY_MAINTENANCE') {
    if (event.section_id) affectedSections.add(event.section_id);
    if (event.job_id) affectedJobs.add(event.job_id);
    windowStartMin = 0;
    windowEndMin = 1440;
  } else if (eventType === 'CREW_UNAVAILABLE') {
    const crewId = event.crew_id;
    for (const [jId, sj] of scheduledJobMap.entries()) {
      if (sj.assigned_crew_id === crewId || (sj.crew_ids && sj.crew_ids.includes(crewId))) {
        affectedJobs.add(jId);
        affectedBlocks.add(sj.block_code);
        affectedSections.add(sj.section_id);
      }
    }
  } else if (eventType === 'CORRIDOR_RESTRICTION_CHANGE') {
    const sectionId = event.section_id;
    if (sectionId) affectedSections.add(sectionId);
    const rStartMin = event.new_value?.start_time ? timeToMinutes(event.new_value.start_time) : 0;
    const rEndMin = event.new_value?.end_time ? timeToMinutes(event.new_value.end_time) : 1440;

    for (const block of currentPlan.blocks) {
      if (block.section_id === sectionId) {
        const bStartMin = timeToMinutes(block.start_time);
        const bEndMin = timeToMinutes(block.end_time);
        if (intervalsOverlap(bStartMin, bEndMin, rStartMin, rEndMin)) {
          affectedBlocks.add(block.block_code);
          for (const j of block.jobs) {
            affectedJobs.add(j.job_id);
          }
        }
      }
    }
  }

  // Any job belonging to an affected block is dependent on the disruption and becomes replannable
  for (const [otherId, sj] of scheduledJobMap.entries()) {
    if (affectedBlocks.has(sj.block_code) || affectedBlocks.has(sj.block_id)) {
      affectedJobs.add(otherId);
    }
  }

  // Determine Frozen Jobs: scheduled jobs that are NOT affected
  const frozenJobs = [];
  const replanJobs = Array.from(affectedJobs);

  for (const [jId, sj] of scheduledJobMap.entries()) {
    if (!affectedJobs.has(jId)) {
      frozenJobs.push({
        job_id: jId,
        start_time: sj.start_time,
        end_time: sj.end_time,
        assigned_crew_id: sj.assigned_crew_id
      });
    }
  }

  return {
    affected_sections: Array.from(affectedSections),
    affected_blocks: Array.from(affectedBlocks),
    affected_jobs: replanJobs,
    frozen_jobs: frozenJobs,
    affected_time_window: {
      start_minutes: windowStartMin < 1440 ? windowStartMin : null,
      end_minutes: windowEndMin > 0 ? windowEndMin : null
    }
  };
};
