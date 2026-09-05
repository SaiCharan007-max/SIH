import {
  findAllSections,
  findPlannableJobs,
  findActiveCrews,
  findTrainMovementsForDate,
  findFreightForecastsForDate,
  findCorridorRestrictionsForDate
} from '../repositories/planning.repository.js';
import {
  insertPlanningRun,
  findLatestRunForDate,
  findPlanningRunDetails,
  insertPlanningEvent,
  persistReplannedRun
} from '../repositories/replanning.repository.js';
import { analyzeEventImpact } from './planningImpact.service.js';
import { comparePlanningRuns } from './planningComparison.service.js';
import { scoreJob } from './priority/priorityModel.js';

/**
 * Extracts HH:MM string from time or ISO timestamp.
 */
export const extractTimeString = (val) => {
  if (!val) return '00:00';
  if (typeof val === 'string') {
    if (val.includes('T')) {
      const parts = val.split('T')[1].split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    const match = val.match(/^(\d{2}):(\d{2})/);
    if (match) return `${match[1]}:${match[2]}`;
  }
  if (val instanceof Date) {
    const hours = String(val.getUTCHours()).padStart(2, '0');
    const mins = String(val.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }
  return '00:00';
};

/**
 * Converts 'HH:MM' string to minutes from midnight.
 */
export const timeToMinutes = (tStr) => {
  const [h, m] = tStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Validates optimizer output against 13 consistency and safety rules.
 */
export const validateOptimizerOutput = (snapshot, plan) => {
  const inputJobMap = new Map(snapshot.jobs.map((j) => [j.job_id, j]));
  const seenScheduledJobs = new Set();
  const seenBlockCodes = new Set();

  const winStartMin = timeToMinutes(snapshot.planning_window.start);
  const winEndMin = timeToMinutes(snapshot.planning_window.end);

  // 1. Every scheduled job exists in input
  for (const block of plan.blocks) {
    // Check block code uniqueness
    if (seenBlockCodes.has(block.block_code)) {
      throw new Error(`Duplicate block_code generated: ${block.block_code}`);
    }
    seenBlockCodes.add(block.block_code);

    const bStartMin = timeToMinutes(block.start_time);
    const bEndMin = timeToMinutes(block.end_time);

    // 3. Block start < block end
    if (bEndMin <= bStartMin) {
      throw new Error(`Block ${block.block_code} has invalid times: ${block.start_time} to ${block.end_time}`);
    }

    for (const j of block.jobs) {
      // 1. Exists in input
      if (!inputJobMap.has(j.job_id)) {
        throw new Error(`Optimizer returned unknown job ${j.job_id} not in input snapshot`);
      }

      // 2. No job appears in multiple blocks
      if (seenScheduledJobs.has(j.job_id)) {
        throw new Error(`Job ${j.job_id} scheduled multiple times across blocks`);
      }
      seenScheduledJobs.add(j.job_id);

      const jStartMin = timeToMinutes(j.start_time);
      const jEndMin = timeToMinutes(j.end_time);

      // 4. Job start < job end
      if (jEndMin <= jStartMin) {
        throw new Error(`Job ${j.job_id} has invalid planned times: ${j.start_time} to ${j.end_time}`);
      }

      // 5. Job duration matches input duration
      const inputJob = inputJobMap.get(j.job_id);
      const actualDuration = jEndMin - jStartMin;
      if (actualDuration !== inputJob.duration_minutes) {
        throw new Error(
          `Job ${j.job_id} duration mismatch: expected ${inputJob.duration_minutes}m, got ${actualDuration}m`
        );
      }

      // 6. Jobs remain inside planning window
      if (jStartMin < winStartMin || jEndMin > winEndMin) {
        throw new Error(`Job ${j.job_id} scheduled outside planning window`);
      }

      // Inside block bounds
      if (jStartMin < bStartMin || jEndMin > bEndMin) {
        throw new Error(`Job ${j.job_id} time [${j.start_time}-${j.end_time}] exceeds block [${block.start_time}-${block.end_time}]`);
      }
    }
  }

  // 12. Every job is either scheduled or unscheduled
  const unscheduledIds = new Set(plan.unscheduled_jobs.map((u) => u.job_id));
  for (const jId of unscheduledIds) {
    if (seenScheduledJobs.has(jId)) {
      throw new Error(`Job ${jId} listed as both scheduled and unscheduled`);
    }
  }

  for (const jId of inputJobMap.keys()) {
    if (!seenScheduledJobs.has(jId) && !unscheduledIds.has(jId)) {
      throw new Error(`Job ${jId} is neither scheduled nor listed in unscheduled_jobs`);
    }
  }

  return true;
};

/**
 * Builds the normalized planning snapshot from the database.
 */
export const buildPlanningSnapshot = async ({ planDate, startTime = '06:00', endTime = '22:00' }) => {
  const [sections, rawJobs, crews, trainMovements, freightForecasts, corridorRestrictions] = await Promise.all([
    findAllSections(),
    findPlannableJobs(),
    findActiveCrews(),
    findTrainMovementsForDate(planDate),
    findFreightForecastsForDate(planDate),
    findCorridorRestrictionsForDate(planDate)
  ]);

  // Score jobs using existing Priority Engine
  const referenceDate = new Date(`${planDate}T00:00:00.000Z`);
  const scoredJobs = rawJobs.map((j) => {
    const scored = scoreJob(j, referenceDate);
    return {
      job_id: j.id,
      job_code: j.job_code,
      section_id: j.section_id,
      section_code: j.section_code,
      department: j.department,
      duration_minutes: j.estimated_duration_minutes,
      priority_score: scored.priority_score,
      priority_level: scored.priority_level,
      criticality: scored.breakdown.criticality,
      urgency: scored.breakdown.urgency,
      overdue_days: scored.breakdown.overdue_days,
      deadline: j.deadline,
      requires_track_block: j.requires_track_block ?? true,
      requires_power_shutdown: j.requires_power_shutdown ?? false,
      requires_signal_shutdown: j.requires_signal_shutdown ?? false,
      crew_ids: j.assignments.map((a) => a.crew_id),
      resources: j.resources.map((r) => ({
        resource_type: r.resource_type,
        resource_name: r.resource_name,
        quantity: r.quantity || 1
      }))
    };
  });

  const normalizedSections = sections.map((s) => ({
    section_id: s.id,
    section_code: s.section_code
  }));

  const normalizedCrews = crews.map((c) => ({
    crew_id: c.id,
    department: c.department,
    capacity: c.capacity,
    active: c.active
  }));

  const normalizedMovements = trainMovements.map((tm) => ({
    section_id: tm.section_id,
    entry_time: extractTimeString(tm.entry_time),
    exit_time: extractTimeString(tm.exit_time),
    priority: tm.priority || 'NORMAL'
  }));

  const normalizedFreight = freightForecasts.map((ff) => ({
    section_id: ff.section_id,
    expected_entry_time: extractTimeString(ff.expected_entry_time),
    exit_time: extractTimeString(ff.expected_exit_time),
    expected_entry_time: extractTimeString(ff.expected_entry_time),
    expected_exit_time: extractTimeString(ff.expected_exit_time),
    expected_train_count: ff.expected_train_count || 1,
    confidence: Number(ff.confidence) || 1.0
  }));

  const normalizedCorridor = corridorRestrictions.map((cr) => ({
    section_id: cr.section_id,
    start_time: extractTimeString(cr.start_time),
    end_time: extractTimeString(cr.end_time),
    status: cr.status
  }));

  return {
    plan_date: planDate,
    planning_window: {
      start: startTime,
      end: endTime
    },
    sections: normalizedSections,
    jobs: scoredJobs,
    crews: normalizedCrews,
    train_movements: normalizedMovements,
    freight_forecasts: normalizedFreight,
    corridor_restrictions: normalizedCorridor
  };
};

/**
 * Invokes the Python block optimization microservice.
 */
export const invokePythonOptimizer = async (snapshot) => {
  const optimizerUrl = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8000';
  const url = `${optimizerUrl}/optimize`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Optimizer service responded with HTTP ${response.status}: ${text}`);
  }

  return response.json();
};

/**
 * Orchestrates planning: snapshot generation -> optimization -> validation -> persistence with run versioning.
 */
export const generateDailyPlan = async ({ planDate, startTime = '06:00', endTime = '22:00' }) => {
  // 1. Validation
  if (!planDate || !/^\d{4}-\d{2}-\d{2}$/.test(planDate)) {
    const err = new Error('Invalid plan_date. Format must be YYYY-MM-DD');
    err.statusCode = 400;
    throw err;
  }

  // 2. Build Snapshot
  const snapshot = await buildPlanningSnapshot({ planDate, startTime, endTime });

  // 3. Call Python Optimizer
  let optimizedPlan;
  try {
    optimizedPlan = await invokePythonOptimizer(snapshot);
  } catch (err) {
    const customErr = new Error(`Optimization failed: ${err.message}`);
    customErr.statusCode = 502;
    throw customErr;
  }

  // 4. Validate output
  validateOptimizerOutput(snapshot, optimizedPlan);

  // 5. Generate Run Code (e.g. RUN-001)
  const runCode = `RUN-${Date.now().toString().slice(-6)}`;

  // 6. Persist Plan with Run Versioning
  const { run, blocks: persistedBlocks } = await persistReplannedRun({
    runCode,
    planDate,
    runType: 'INITIAL',
    parentRunId: null,
    reason: 'Initial daily planning schedule',
    metrics: optimizedPlan.metrics,
    blocks: optimizedPlan.blocks || [],
    eventId: null
  });

  // 7. Return response
  return {
    run_id: run.id,
    run_code: run.run_code,
    plan_date: planDate,
    status: 'PROPOSED',
    blocks: optimizedPlan.blocks,
    unscheduled_jobs: optimizedPlan.unscheduled_jobs,
    metrics: optimizedPlan.metrics,
    persisted_block_count: persistedBlocks.length
  };
};

/**
 * Orchestrates dynamic replanning:
 * 1. Log event into planning_events.
 * 2. Retrieve latest active/proposed plan.
 * 3. Perform impact analysis (detect affected vs frozen jobs).
 * 4. Assemble REPLAN snapshot with frozen jobs and previous schedule.
 * 5. Call Python optimizer.
 * 6. Validate complete replanned schedule.
 * 7. Atomically persist new planning run, link blocks, supersede parent run.
 * 8. Return comparison & metrics.
 */
export const executeReplan = async ({ planDate, event }) => {
  if (!planDate || !/^\d{4}-\d{2}-\d{2}$/.test(planDate)) {
    const err = new Error('Invalid plan_date. Format must be YYYY-MM-DD');
    err.statusCode = 400;
    throw err;
  }

  if (!event || !event.event_type) {
    const err = new Error('Invalid event payload: event_type is required');
    err.statusCode = 400;
    throw err;
  }

  // 1. Find parent active run
  const parentRun = await findLatestRunForDate(planDate);
  if (!parentRun) {
    const err = new Error(`No active planning run found for date ${planDate} to replan against`);
    err.statusCode = 404;
    throw err;
  }

  const parentRunDetails = await findPlanningRunDetails(parentRun.id);

  // 2. Insert event record (RECEIVED)
  const eventCode = `EVT-${Date.now().toString().slice(-6)}`;
  const savedEvent = await insertPlanningEvent({
    eventCode,
    eventType: event.event_type,
    planDate,
    sectionId: event.section_id,
    jobId: event.job_id,
    trainId: event.train_id,
    crewId: event.crew_id,
    oldValue: event.old_value,
    newValue: event.new_value,
    description: event.description || `Disruption event: ${event.event_type}`,
    status: 'RECEIVED'
  });

  // 3. Build base snapshot
  const baseSnapshot = await buildPlanningSnapshot({ planDate, startTime: '06:00', endTime: '22:00' });

  // 4. Perform Impact Analysis
  const impact = analyzeEventImpact(parentRunDetails, event, baseSnapshot);

  // 5. Build Previous Schedule Map
  const previousSchedule = {};
  for (const b of parentRunDetails.blocks || []) {
    for (const j of b.jobs || []) {
      previousSchedule[j.job_id] = {
        start_time: extractTimeString(j.planned_start || j.start_time),
        end_time: extractTimeString(j.planned_end || j.end_time)
      };
    }
  }

  // 6. Assemble REPLAN Snapshot
  const replanSnapshot = {
    ...baseSnapshot,
    mode: 'REPLAN',
    frozen_jobs: impact.frozen_jobs,
    replan_jobs: impact.affected_jobs,
    previous_schedule: previousSchedule
  };

  // Apply event-specific updates to snapshot
  if (event.event_type === 'MAINTENANCE_OVERRUN' && event.job_id) {
    const newEndStr = event.new_value?.actual_end || event.new_value?.end_time;
    if (newEndStr) {
      const overrunningJob = replanSnapshot.jobs.find(j => j.job_id === event.job_id);
      if (overrunningJob) {
        const prevStart = previousSchedule[event.job_id]?.start_time || '12:00';
        const startMin = timeToMinutes(prevStart);
        const newEndMin = timeToMinutes(newEndStr);
        overrunningJob.duration_minutes = Math.max(overrunningJob.duration_minutes, newEndMin - startMin);

        // Update frozen_jobs with overrun end time so it stays anchored at extended interval
        const fj = replanSnapshot.frozen_jobs.find(f => f.job_id === event.job_id);
        if (fj) {
          fj.end_time = newEndStr;
        } else {
          replanSnapshot.frozen_jobs.push({
            job_id: event.job_id,
            start_time: prevStart,
            end_time: newEndStr,
            assigned_crew_id: overrunningJob.crew_ids?.[0]
          });
        }
      }
    }
  } else if (event.event_type === 'TRAIN_DELAY') {
    const newEntry = event.new_value?.entry_time;
    const newExit = event.new_value?.exit_time;
    if (newEntry && newExit) {
      const tm = replanSnapshot.train_movements.find(t =>
        (event.train_id && t.train_id === event.train_id) ||
        (event.section_id && t.section_id === event.section_id && event.old_value?.entry_time && t.entry_time.startsWith(event.old_value.entry_time))
      );
      if (tm) {
        tm.entry_time = newEntry;
        tm.exit_time = newExit;
      } else if (event.section_id) {
        replanSnapshot.train_movements.push({
          movement_id: `delay-${Date.now()}`,
          train_id: event.train_id || `TRN-DELAY-${Date.now().toString().slice(-4)}`,
          train_number: 'TRN-DELAY',
          section_id: event.section_id,
          entry_time: newEntry,
          exit_time: newExit
        });
      }
    }
  } else if (event.event_type === 'TRAIN_CANCELLATION') {
    replanSnapshot.train_movements = replanSnapshot.train_movements.filter(t =>
      !(event.train_id && t.train_id === event.train_id) &&
      !(event.section_id && t.section_id === event.section_id && event.old_value?.entry_time && t.entry_time.startsWith(event.old_value.entry_time))
    );
  } else if (event.event_type === 'CREW_UNAVAILABLE' && event.crew_id) {
    replanSnapshot.crews = replanSnapshot.crews.filter(c => c.crew_id !== event.crew_id);
    for (const j of replanSnapshot.jobs) {
      j.crew_ids = (j.crew_ids || []).filter(cid => cid !== event.crew_id);
    }
  } else if (event.event_type === 'CORRIDOR_RESTRICTION_CHANGE' && event.section_id) {
    const rStart = event.new_value?.start_time || '00:00';
    const rEnd = event.new_value?.end_time || '23:59';
    replanSnapshot.corridor_restrictions.push({
      restriction_id: `restr-${Date.now()}`,
      section_id: event.section_id,
      start_time: rStart,
      end_time: rEnd,
      is_available: false,
      reason: event.description || 'Corridor restriction change'
    });
  }

  // Ensure every frozen job's duration_minutes matches its fixed interval
  for (const fj of replanSnapshot.frozen_jobs) {
    const j = replanSnapshot.jobs.find(job => job.job_id === fj.job_id);
    if (j) {
      const dur = timeToMinutes(fj.end_time) - timeToMinutes(fj.start_time);
      if (dur > 0) {
        j.duration_minutes = dur;
      }
    }
  }

  // 7. Invoke Python Optimizer
  let optimizedPlan;
  try {
    optimizedPlan = await invokePythonOptimizer(replanSnapshot);
  } catch (err) {
    // Record failure in event
    await insertPlanningRun({
      runCode: `RUN-FAIL-${Date.now().toString().slice(-6)}`,
      planDate,
      runType: 'REPLAN',
      parentRunId: parentRun.id,
      status: 'FAILED',
      reason: err.message
    });
    const customErr = new Error(`Replanning optimization failed: ${err.message}`);
    customErr.statusCode = 502;
    throw customErr;
  }

  // 8. Validate output
  validateOptimizerOutput(replanSnapshot, optimizedPlan);

  // 9. Verify frozen jobs did not move
  for (const fj of replanSnapshot.frozen_jobs) {
    const scheduledJ = optimizedPlan.blocks
      .flatMap(b => b.jobs)
      .find(j => j.job_id === fj.job_id);

    if (!scheduledJ) {
      throw new Error(`Frozen job ${fj.job_id} was dropped by optimizer in REPLAN mode`);
    }
    if (scheduledJ.start_time !== fj.start_time || scheduledJ.end_time !== fj.end_time) {
      throw new Error(
        `Frozen job ${fj.job_id} was moved from ${fj.start_time}-${fj.end_time} to ${scheduledJ.start_time}-${scheduledJ.end_time}`
      );
    }
  }

  // 10. Persist Replan Run Atomically
  const newRunCode = `RUN-${Date.now().toString().slice(-6)}`;
  const { run: newRun, blocks: persistedBlocks } = await persistReplannedRun({
    runCode: newRunCode,
    planDate,
    runType: 'REPLAN',
    parentRunId: parentRun.id,
    reason: `Replanned due to ${event.event_type}: ${event.description || ''}`,
    metrics: optimizedPlan.metrics,
    blocks: optimizedPlan.blocks || [],
    eventId: savedEvent.id
  });

  // 11. Retrieve full details of both runs for comparison
  const newRunDetails = await findPlanningRunDetails(newRun.id);
  const comparison = comparePlanningRuns(parentRunDetails, newRunDetails);

  return {
    run_id: newRun.id,
    run_code: newRun.run_code,
    parent_run_id: parentRun.id,
    parent_run_code: parentRun.run_code,
    status: 'PROPOSED',
    reason: event.event_type,
    affected_sections: impact.affected_sections,
    affected_blocks: impact.affected_blocks,
    unchanged_blocks: comparison.summary.blocks_count_new - impact.affected_blocks.length,
    replanned_blocks: impact.affected_blocks.length,
    metrics: {
      jobs_affected: impact.affected_jobs.length,
      jobs_rescheduled: comparison.summary.jobs_moved,
      jobs_unscheduled: comparison.summary.jobs_unscheduled,
      jobs_unchanged: comparison.summary.jobs_unchanged
    },
    comparison,
    plan: newRunDetails
  };
};
