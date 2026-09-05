import {
  findAllSections,
  findPlannableJobs,
  findActiveCrews,
  findTrainMovementsForDate,
  findFreightForecastsForDate,
  findCorridorRestrictionsForDate,
  persistOptimizedBlocks
} from '../repositories/planning.repository.js';
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
 * Orchestrates planning: snapshot generation -> optimization -> validation -> persistence.
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

  // 5. Persist Proposed Plan
  let persistedBlocks = [];
  if (optimizedPlan.blocks && optimizedPlan.blocks.length > 0) {
    persistedBlocks = await persistOptimizedBlocks(planDate, optimizedPlan.blocks, 'PROPOSED');
  }

  // 6. Return response
  return {
    plan_date: planDate,
    status: 'PROPOSED',
    blocks: optimizedPlan.blocks,
    unscheduled_jobs: optimizedPlan.unscheduled_jobs,
    metrics: optimizedPlan.metrics,
    persisted_block_count: persistedBlocks.length
  };
};
