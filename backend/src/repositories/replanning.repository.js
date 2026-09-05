import { query, getPool } from '../config/db.js';

/**
 * Creates a new planning run entry.
 */
export const insertPlanningRun = async ({ runCode, planDate, runType, parentRunId, status, reason, metrics }) => {
  const sql = `
    INSERT INTO planning_runs (
      run_code, plan_date, run_type, parent_run_id, status, reason, metrics
    )
    VALUES ($1, $2, $3::planning_run_type, $4, $5::planning_run_status, $6, $7)
    RETURNING *
  `;
  const values = [
    runCode,
    planDate,
    runType || 'INITIAL',
    parentRunId || null,
    status || 'PROPOSED',
    reason || null,
    JSON.stringify(metrics || {})
  ];
  const res = await query(sql, values);
  return res.rows[0];
};

/**
 * Finds the latest active or proposed planning run for a date.
 */
export const findLatestRunForDate = async (planDate) => {
  const sql = `
    SELECT * FROM planning_runs 
    WHERE plan_date = $1 AND status = 'PROPOSED'
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  const res = await query(sql, [planDate]);
  return res.rows[0] || null;
};

/**
 * Retrieves planning runs with optional filtering.
 */
export const findPlanningRuns = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.plan_date) {
    values.push(filters.plan_date);
    conditions.push(`plan_date = $${values.length}`);
  }
  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}::planning_run_status`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM planning_runs ${whereClause} ORDER BY created_at DESC`;
  const res = await query(sql, values);
  return res.rows;
};

/**
 * Retrieves a single planning run along with its blocks and block jobs.
 */
export const findPlanningRunDetails = async (runId) => {
  const runSql = 'SELECT * FROM planning_runs WHERE id = $1';
  const runRes = await query(runSql, [runId]);
  if (runRes.rows.length === 0) return null;

  const run = runRes.rows[0];

  const blocksSql = `
    SELECT b.*, s.section_code
    FROM maintenance_blocks b
    JOIN railway_sections s ON b.section_id = s.id
    WHERE b.planning_run_id = $1
    ORDER BY b.start_time ASC
  `;
  const blocksRes = await query(blocksSql, [runId]);
  const blocks = blocksRes.rows;

  if (blocks.length === 0) {
    return { ...run, blocks: [] };
  }

  const blockIds = blocks.map(b => b.id);
  const blockJobsSql = `
    SELECT bj.*, j.job_code, j.department, j.estimated_duration_minutes, j.criticality, j.urgency
    FROM maintenance_block_jobs bj
    JOIN maintenance_jobs j ON bj.job_id = j.id
    WHERE bj.block_id = ANY($1::uuid[])
    ORDER BY bj.planned_start ASC
  `;
  const bjRes = await query(blockJobsSql, [blockIds]);

  const jobsByBlock = {};
  for (const row of bjRes.rows) {
    if (!jobsByBlock[row.block_id]) jobsByBlock[row.block_id] = [];
    jobsByBlock[row.block_id].push(row);
  }

  return {
    ...run,
    blocks: blocks.map(b => ({
      ...b,
      jobs: jobsByBlock[b.id] || []
    }))
  };
};

/**
 * Inserts a planning event record.
 */
export const insertPlanningEvent = async ({
  eventCode,
  eventType,
  planDate,
  sectionId,
  jobId,
  trainId,
  crewId,
  oldValue,
  newValue,
  description,
  status = 'RECEIVED',
  planningRunId = null
}) => {
  const sql = `
    INSERT INTO planning_events (
      event_code, event_type, plan_date, section_id, job_id, train_id, crew_id,
      old_value, new_value, description, status, planning_run_id
    )
    VALUES ($1, $2::planning_event_type, $3, $4, $5, $6, $7, $8, $9, $10, $11::planning_event_status, $12)
    RETURNING *
  `;
  const values = [
    eventCode,
    eventType,
    planDate,
    sectionId || null,
    jobId || null,
    trainId || null,
    crewId || null,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    description || null,
    status,
    planningRunId
  ];
  const res = await query(sql, values);
  return res.rows[0];
};

/**
 * Transactional persistence for dynamic replanning:
 * 1. Insert planning_run (status: PROPOSED)
 * 2. Insert maintenance_blocks linked to planning_run_id
 * 3. Insert maintenance_block_jobs
 * 4. Update parent run to SUPERSEDED
 * 5. Update event status to PROCESSED
 */
export const persistReplannedRun = async ({
  runCode,
  planDate,
  runType,
  parentRunId,
  reason,
  metrics,
  blocks,
  eventId
}) => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create new planning run
    const runSql = `
      INSERT INTO planning_runs (
        run_code, plan_date, run_type, parent_run_id, status, reason, metrics
      )
      VALUES ($1, $2, $3::planning_run_type, $4, 'PROPOSED', $5, $6)
      RETURNING *
    `;
    const runValues = [
      runCode,
      planDate,
      runType,
      parentRunId,
      reason,
      JSON.stringify(metrics || {})
    ];
    const runRes = await client.query(runSql, runValues);
    const newRun = runRes.rows[0];

    // 2. Insert blocks
    const persistedBlocks = [];
    for (const b of blocks) {
      const blockCode = `${b.block_code}-${newRun.run_code}`;
      const blockSql = `
        INSERT INTO maintenance_blocks (
          block_code, section_id, plan_date, start_time, end_time, status, planning_run_id
        )
        VALUES ($1, $2, $3, $4, $5, 'PROPOSED', $6)
        RETURNING *
      `;
      const blockValues = [
        blockCode,
        b.section_id,
        planDate,
        b.start_time,
        b.end_time,
        newRun.id
      ];
      const blockRes = await client.query(blockSql, blockValues);
      const insertedBlock = blockRes.rows[0];

      // 3. Insert block jobs
      const persistedJobs = [];
      for (const j of b.jobs) {
        const bjSql = `
          INSERT INTO maintenance_block_jobs (
            block_id, job_id, planned_start, planned_end
          )
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        const bjValues = [
          insertedBlock.id,
          j.job_id,
          j.start_time,
          j.end_time
        ];
        const bjRes = await client.query(bjSql, bjValues);
        persistedJobs.push(bjRes.rows[0]);
      }

      persistedBlocks.push({
        ...insertedBlock,
        jobs: persistedJobs
      });
    }

    // 4. Supersede parent run
    if (parentRunId) {
      await client.query(
        "UPDATE planning_runs SET status = 'SUPERSEDED' WHERE id = $1",
        [parentRunId]
      );
    }

    // 5. Update event status
    if (eventId) {
      await client.query(
        "UPDATE planning_events SET status = 'PROCESSED', planning_run_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [newRun.id, eventId]
      );
    }

    await client.query('COMMIT');

    return {
      run: newRun,
      blocks: persistedBlocks
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
