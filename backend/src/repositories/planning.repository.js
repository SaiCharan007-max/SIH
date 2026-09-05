import { query, getPool } from '../config/db.js';

/**
 * Retrieves all railway sections.
 */
export const findAllSections = async () => {
  const sql = 'SELECT id, section_code, name, track_count, electrified FROM railway_sections ORDER BY section_code ASC';
  const res = await query(sql);
  return res.rows;
};

/**
 * Retrieves candidate maintenance jobs (PENDING, PLANNED, APPROVED) along with their
 * asset details, assignments, and required resources.
 */
export const findPlannableJobs = async () => {
  const sql = `
    SELECT 
      j.id,
      j.job_code,
      j.department,
      j.asset_id,
      j.section_id,
      s.section_code,
      j.work_type,
      j.description,
      j.estimated_duration_minutes,
      j.criticality,
      j.urgency,
      j.overdue_days,
      j.deadline,
      j.status,
      j.requires_track_block,
      j.requires_power_shutdown,
      j.requires_signal_shutdown,
      a.asset_code,
      a.status AS asset_status
    FROM maintenance_jobs j
    JOIN railway_sections s ON j.section_id = s.id
    LEFT JOIN assets a ON j.asset_id = a.id
    WHERE j.status IN ('PENDING', 'PLANNED')
    ORDER BY j.created_at ASC
  `;
  const res = await query(sql);
  const jobs = res.rows;

  if (jobs.length === 0) return [];

  const jobIds = jobs.map((j) => j.id);

  // Fetch assignments
  const assignSql = `
    SELECT mja.job_id, c.id AS crew_id, c.crew_code, c.name AS crew_name, c.department
    FROM maintenance_job_assignments mja
    JOIN crews c ON mja.crew_id = c.id
    WHERE mja.job_id = ANY($1::uuid[]) AND mja.released_at IS NULL
  `;
  const assignRes = await query(assignSql, [jobIds]);
  const assignByJob = {};
  for (const row of assignRes.rows) {
    if (!assignByJob[row.job_id]) assignByJob[row.job_id] = [];
    assignByJob[row.job_id].push(row);
  }

  // Fetch resources
  const resSql = `
    SELECT job_id, resource_type, resource_name, quantity
    FROM maintenance_job_resources
    WHERE job_id = ANY($1::uuid[])
  `;
  const resResult = await query(resSql, [jobIds]);
  const resByJob = {};
  for (const row of resResult.rows) {
    if (!resByJob[row.job_id]) resByJob[row.job_id] = [];
    resByJob[row.job_id].push(row);
  }

  return jobs.map((j) => ({
    ...j,
    assignments: assignByJob[j.id] || [],
    resources: resByJob[j.id] || []
  }));
};

/**
 * Retrieves all active maintenance crews.
 */
export const findActiveCrews = async () => {
  const sql = 'SELECT id, crew_code, department, name, capacity, active FROM crews WHERE active = true';
  const res = await query(sql);
  return res.rows;
};

/**
 * Retrieves scheduled train movements for a specific planning date.
 */
export const findTrainMovementsForDate = async (planDate) => {
  const sql = `
    SELECT 
      tm.id,
      tm.section_id,
      s.section_code,
      tm.entry_time,
      tm.exit_time,
      t.train_number,
      t.priority
    FROM train_movements tm
    JOIN railway_sections s ON tm.section_id = s.id
    JOIN train_routes tr ON tm.train_route_id = tr.id
    JOIN trains t ON tr.train_id = t.id
    WHERE tr.service_date = $1 AND tm.status != 'CANCELLED'
    ORDER BY tm.entry_time ASC
  `;
  const res = await query(sql, [planDate]);
  return res.rows;
};

/**
 * Retrieves freight forecasts for a specific date.
 */
export const findFreightForecastsForDate = async (planDate) => {
  const sql = `
    SELECT 
      ff.id,
      ff.section_id,
      s.section_code,
      ff.expected_entry_time,
      ff.expected_exit_time,
      ff.expected_train_count,
      ff.confidence
    FROM freight_forecasts ff
    JOIN railway_sections s ON ff.section_id = s.id
    WHERE ff.forecast_date = $1
    ORDER BY ff.expected_entry_time ASC
  `;
  const res = await query(sql, [planDate]);
  return res.rows;
};

/**
 * Retrieves corridor restrictions / availability for a specific date.
 */
export const findCorridorRestrictionsForDate = async (planDate) => {
  const sql = `
    SELECT 
      ca.id,
      ca.section_id,
      s.section_code,
      ca.start_time,
      ca.end_time,
      ca.status,
      ca.reason
    FROM corridor_availability ca
    JOIN railway_sections s ON ca.section_id = s.id
    WHERE ca.availability_date = $1
    ORDER BY ca.start_time ASC
  `;
  const res = await query(sql, [planDate]);
  return res.rows;
};

/**
 * Transactional persistence for proposed maintenance blocks and block-job associations.
 */
export const persistOptimizedBlocks = async (planDate, blocks, status = 'PROPOSED') => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clean up any previously generated PROPOSED blocks for this planning date
    await client.query("DELETE FROM maintenance_blocks WHERE plan_date = $1 AND status = 'PROPOSED'", [planDate]);

    const persistedBlocks = [];

    // Determine current highest sequence number for this date
    for (const b of blocks) {
      // 1. Insert maintenance_block
      const blockCode = `${b.block_code}-${planDate.replace(/-/g, '')}`;
      const blockSql = `
        INSERT INTO maintenance_blocks (
          block_code, section_id, plan_date, start_time, end_time, status
        )
        VALUES ($1, $2, $3, $4, $5, $6::block_status)
        ON CONFLICT (block_code) DO UPDATE
        SET start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      const blockValues = [
        blockCode,
        b.section_id,
        planDate,
        b.start_time,
        b.end_time,
        status
      ];
      const blockRes = await client.query(blockSql, blockValues);
      const insertedBlock = blockRes.rows[0];

      // 2. Insert maintenance_block_jobs
      const persistedJobs = [];
      for (const j of b.jobs) {
        const blockJobSql = `
          INSERT INTO maintenance_block_jobs (
            block_id, job_id, planned_start, planned_end
          )
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        const blockJobValues = [
          insertedBlock.id,
          j.job_id,
          j.start_time,
          j.end_time
        ];
        const bjRes = await client.query(blockJobSql, blockJobValues);
        persistedJobs.push(bjRes.rows[0]);
      }

      persistedBlocks.push({
        ...insertedBlock,
        jobs: persistedJobs
      });
    }

    await client.query('COMMIT');
    return persistedBlocks;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
