/**
 * Compares two planning runs (e.g. Initial vs Replan) and produces a structured diff.
 */
export const comparePlanningRuns = (oldRunDetails, newRunDetails) => {
  const oldJobs = new Map();
  const newJobs = new Map();

  for (const b of oldRunDetails.blocks || []) {
    for (const j of b.jobs || []) {
      oldJobs.set(j.job_id, {
        ...j,
        block_code: b.block_code,
        start_time: j.start_time || j.planned_start,
        end_time: j.end_time || j.planned_end
      });
    }
  }

  for (const b of newRunDetails.blocks || []) {
    for (const j of b.jobs || []) {
      newJobs.set(j.job_id, {
        ...j,
        block_code: b.block_code,
        start_time: j.start_time || j.planned_start,
        end_time: j.end_time || j.planned_end
      });
    }
  }

  const changes = [];
  let jobsUnchanged = 0;
  let jobsMoved = 0;
  let jobsNewlyScheduled = 0;
  let jobsUnscheduled = 0;

  // Check all old jobs
  for (const [jobId, oldJ] of oldJobs.entries()) {
    if (newJobs.has(jobId)) {
      const newJ = newJobs.get(jobId);
      if (oldJ.start_time === newJ.start_time && oldJ.end_time === newJ.end_time) {
        jobsUnchanged++;
        changes.push({
          job_id: jobId,
          change: 'UNCHANGED',
          start_time: oldJ.start_time,
          end_time: oldJ.end_time
        });
      } else {
        jobsMoved++;
        changes.push({
          job_id: jobId,
          change: 'MOVED',
          old_start: oldJ.start_time,
          old_end: oldJ.end_time,
          new_start: newJ.start_time,
          new_end: newJ.end_time
        });
      }
    } else {
      jobsUnscheduled++;
      changes.push({
        job_id: jobId,
        change: 'UNSCHEDULED',
        old_start: oldJ.start_time,
        old_end: oldJ.end_time
      });
    }
  }

  // Check newly scheduled jobs
  for (const [jobId, newJ] of newJobs.entries()) {
    if (!oldJobs.has(jobId)) {
      jobsNewlyScheduled++;
      changes.push({
        job_id: jobId,
        change: 'NEWLY_SCHEDULED',
        new_start: newJ.start_time,
        new_end: newJ.end_time
      });
    }
  }

  const oldBlockCodes = new Set((oldRunDetails.blocks || []).map(b => b.block_code));
  const newBlockCodes = new Set((newRunDetails.blocks || []).map(b => b.block_code));

  let blocksUnchanged = 0;
  for (const code of newBlockCodes) {
    if (oldBlockCodes.has(code)) blocksUnchanged++;
  }

  return {
    old_run_id: oldRunDetails.id,
    new_run_id: newRunDetails.id,
    summary: {
      jobs_unchanged: jobsUnchanged,
      jobs_moved: jobsMoved,
      jobs_newly_scheduled: jobsNewlyScheduled,
      jobs_unscheduled: jobsUnscheduled,
      blocks_count_old: (oldRunDetails.blocks || []).length,
      blocks_count_new: (newRunDetails.blocks || []).length
    },
    changes
  };
};
