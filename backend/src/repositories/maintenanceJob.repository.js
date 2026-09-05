import { query } from '../config/db.js';

export const findAssetById = async (assetId) => {
  const res = await query('SELECT * FROM assets WHERE id = $1', [assetId]);
  return res.rows[0] || null;
};

export const findSectionById = async (sectionId) => {
  const res = await query('SELECT * FROM railway_sections WHERE id = $1', [sectionId]);
  return res.rows[0] || null;
};

export const findJobByCode = async (jobCode) => {
  const res = await query('SELECT * FROM maintenance_jobs WHERE job_code = $1', [jobCode]);
  return res.rows[0] || null;
};

export const insertJob = async (job) => {
  const sql = `
    INSERT INTO maintenance_jobs (
      job_code,
      department,
      asset_id,
      section_id,
      work_type,
      description,
      estimated_duration_minutes,
      criticality,
      urgency,
      overdue_days,
      deadline,
      status,
      requires_track_block,
      requires_power_shutdown,
      requires_signal_shutdown,
      planned_start,
      planned_end,
      actual_start,
      actual_end
    )
    VALUES (
      $1, $2::department_type, $3, $4, $5::maintenance_work_type, $6, $7, $8, $9, $10,
      $11, COALESCE($12, 'PENDING')::job_status, COALESCE($13, false), COALESCE($14, false), COALESCE($15, false),
      $16, $17, $18, $19
    )
    RETURNING *;
  `;

  const values = [
    job.job_code,
    job.department,
    job.asset_id,
    job.section_id,
    job.work_type,
    job.description,
    job.estimated_duration_minutes,
    job.criticality,
    job.urgency,
    job.overdue_days ?? 0,
    job.deadline || null,
    job.status || 'PENDING',
    job.requires_track_block ?? false,
    job.requires_power_shutdown ?? false,
    job.requires_signal_shutdown ?? false,
    job.planned_start || null,
    job.planned_end || null,
    job.actual_start || null,
    job.actual_end || null
  ];

  const res = await query(sql, values);
  return res.rows[0];
};

export const findJobs = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.department) {
    values.push(filters.department);
    conditions.push(`j.department = $${values.length}`);
  }

  if (filters.section_id) {
    values.push(filters.section_id);
    conditions.push(`j.section_id = $${values.length}`);
  }

  if (filters.asset_id) {
    values.push(filters.asset_id);
    conditions.push(`j.asset_id = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`j.status = $${values.length}`);
  }

  if (filters.criticality !== undefined && filters.criticality !== null) {
    values.push(Number(filters.criticality));
    conditions.push(`j.criticality = $${values.length}`);
  }

  if (filters.urgency !== undefined && filters.urgency !== null) {
    values.push(Number(filters.urgency));
    conditions.push(`j.urgency = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      j.*,
      a.asset_code,
      a.name AS asset_name,
      a.asset_type,
      s.section_code,
      s.name AS section_name,
      st_from.code AS from_station_code,
      st_to.code AS to_station_code
    FROM maintenance_jobs j
    JOIN assets a ON j.asset_id = a.id
    JOIN railway_sections s ON j.section_id = s.id
    JOIN stations st_from ON s.from_station_id = st_from.id
    JOIN stations st_to ON s.to_station_id = st_to.id
    ${whereClause}
    ORDER BY j.criticality DESC, j.urgency DESC, j.created_at DESC;
  `;

  const res = await query(sql, values);
  return res.rows;
};

export const findJobById = async (id) => {
  const jobSql = `
    SELECT 
      j.*,
      a.asset_code,
      a.name AS asset_name,
      a.asset_type,
      s.section_code,
      s.name AS section_name,
      st_from.code AS from_station_code,
      st_to.code AS to_station_code
    FROM maintenance_jobs j
    JOIN assets a ON j.asset_id = a.id
    JOIN railway_sections s ON j.section_id = s.id
    JOIN stations st_from ON s.from_station_id = st_from.id
    JOIN stations st_to ON s.to_station_id = st_to.id
    WHERE j.id = $1;
  `;

  const jobRes = await query(jobSql, [id]);
  if (jobRes.rows.length === 0) {
    return null;
  }

  const job = jobRes.rows[0];

  // Fetch crew assignments
  const assignSql = `
    SELECT 
      mja.id AS assignment_id,
      mja.assigned_at,
      mja.released_at,
      mja.is_primary,
      c.id AS crew_id,
      c.crew_code,
      c.name AS crew_name,
      c.department AS crew_department
    FROM maintenance_job_assignments mja
    JOIN crews c ON mja.crew_id = c.id
    WHERE mja.job_id = $1
    ORDER BY mja.assigned_at ASC;
  `;
  const assignRes = await query(assignSql, [id]);

  // Fetch resources
  const resSql = `
    SELECT 
      id AS resource_id,
      resource_type,
      resource_name,
      quantity
    FROM maintenance_job_resources
    WHERE job_id = $1
    ORDER BY created_at ASC;
  `;
  const resourcesRes = await query(resSql, [id]);

  return {
    ...job,
    assignments: assignRes.rows,
    resources: resourcesRes.rows
  };
};

export const updateJob = async (id, updatePayload) => {
  const allowedColumns = [
    'description',
    'work_type',
    'estimated_duration_minutes',
    'criticality',
    'urgency',
    'overdue_days',
    'deadline',
    'status',
    'requires_track_block',
    'requires_power_shutdown',
    'requires_signal_shutdown',
    'planned_start',
    'planned_end',
    'actual_start',
    'actual_end'
  ];

  const setClauses = [];
  const values = [];

  for (const [key, value] of Object.entries(updatePayload)) {
    if (allowedColumns.includes(key)) {
      values.push(value);
      if (key === 'status') {
        setClauses.push(`${key} = $${values.length}::job_status`);
      } else if (key === 'work_type') {
        setClauses.push(`${key} = $${values.length}::maintenance_work_type`);
      } else {
        setClauses.push(`${key} = $${values.length}`);
      }
    }
  }

  if (setClauses.length === 0) {
    return findJobById(id);
  }

  values.push(id);
  const sql = `
    UPDATE maintenance_jobs
    SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length}
    RETURNING *;
  `;

  const res = await query(sql, values);
  if (res.rows.length === 0) {
    return null;
  }
  return res.rows[0];
};
