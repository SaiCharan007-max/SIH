import * as jobRepo from '../repositories/maintenanceJob.repository.js';

const VALID_DEPARTMENTS = ['ENGINEERING', 'TRACTION_DISTRIBUTION', 'SIGNAL_TELECOM'];

const VALID_STATUSES = ['PENDING', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const VALID_WORK_TYPES = {
  ENGINEERING: [
    'TRACK_INSPECTION',
    'RAIL_REPLACEMENT',
    'SLEEPER_REPLACEMENT',
    'TURNOUT_MAINTENANCE'
  ],
  TRACTION_DISTRIBUTION: [
    'OHE_INSPECTION',
    'OHE_MAINTENANCE',
    'TRACTION_EQUIPMENT_MAINTENANCE'
  ],
  SIGNAL_TELECOM: [
    'SIGNAL_MAINTENANCE',
    'TRACK_CIRCUIT_MAINTENANCE',
    'POINT_MACHINE_MAINTENANCE'
  ]
};

export const createJob = async (jobData) => {
  const {
    job_code,
    department,
    asset_id,
    section_id,
    work_type,
    description,
    estimated_duration_minutes,
    criticality,
    urgency
  } = jobData;

  // 1. Mandatory field checks
  if (!job_code || typeof job_code !== 'string' || !job_code.trim()) {
    const err = new Error('job_code is required and must be a non-empty string');
    err.statusCode = 400;
    throw err;
  }

  if (!department || !VALID_DEPARTMENTS.includes(department)) {
    const err = new Error(`Invalid department. Allowed values: ${VALID_DEPARTMENTS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (!asset_id) {
    const err = new Error('asset_id is required');
    err.statusCode = 400;
    throw err;
  }

  if (!section_id) {
    const err = new Error('section_id is required');
    err.statusCode = 400;
    throw err;
  }

  const deptWorkTypes = VALID_WORK_TYPES[department] || [];
  if (!work_type || !deptWorkTypes.includes(work_type)) {
    const err = new Error(`Invalid work_type for department ${department}. Allowed values: ${deptWorkTypes.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    const err = new Error('description is required and must be a non-empty string');
    err.statusCode = 400;
    throw err;
  }

  const duration = Number(estimated_duration_minutes);
  if (!Number.isInteger(duration) || duration <= 0) {
    const err = new Error('estimated_duration_minutes must be an integer greater than 0');
    err.statusCode = 400;
    throw err;
  }

  const crit = Number(criticality);
  if (!Number.isInteger(crit) || crit < 1 || crit > 10) {
    const err = new Error('criticality must be an integer between 1 and 10');
    err.statusCode = 400;
    throw err;
  }

  const urg = Number(urgency);
  if (!Number.isInteger(urg) || urg < 1 || urg > 10) {
    const err = new Error('urgency must be an integer between 1 and 10');
    err.statusCode = 400;
    throw err;
  }

  // 2. Referential integrity validation
  const asset = await jobRepo.findAssetById(asset_id);
  if (!asset) {
    const err = new Error(`Referenced asset with ID "${asset_id}" does not exist`);
    err.statusCode = 400;
    throw err;
  }

  const section = await jobRepo.findSectionById(section_id);
  if (!section) {
    const err = new Error(`Referenced section with ID "${section_id}" does not exist`);
    err.statusCode = 400;
    throw err;
  }

  if (asset.section_id !== section_id) {
    const err = new Error(`Asset "${asset.asset_code}" is located on section "${asset.section_id}", not the provided section "${section_id}"`);
    err.statusCode = 400;
    throw err;
  }

  if (asset.department !== department) {
    const err = new Error(`Asset department (${asset.department}) does not match job department (${department})`);
    err.statusCode = 400;
    throw err;
  }

  // Check unique job code
  const existingJob = await jobRepo.findJobByCode(job_code);
  if (existingJob) {
    const err = new Error(`A maintenance job with job_code "${job_code}" already exists`);
    err.statusCode = 400;
    throw err;
  }

  // 3. Delegate to repository
  return jobRepo.insertJob({
    ...jobData,
    estimated_duration_minutes: duration,
    criticality: crit,
    urgency: urg
  });
};

export const getJobs = async (queryFilters) => {
  const filters = {};

  if (queryFilters.department) {
    if (!VALID_DEPARTMENTS.includes(queryFilters.department)) {
      const err = new Error(`Invalid department filter. Allowed values: ${VALID_DEPARTMENTS.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
    filters.department = queryFilters.department;
  }

  if (queryFilters.section_id) {
    filters.section_id = queryFilters.section_id;
  }

  if (queryFilters.asset_id) {
    filters.asset_id = queryFilters.asset_id;
  }

  if (queryFilters.status) {
    if (!VALID_STATUSES.includes(queryFilters.status)) {
      const err = new Error(`Invalid status filter. Allowed values: ${VALID_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
    filters.status = queryFilters.status;
  }

  if (queryFilters.criticality !== undefined) {
    const crit = Number(queryFilters.criticality);
    if (!Number.isInteger(crit) || crit < 1 || crit > 10) {
      const err = new Error('criticality filter must be an integer between 1 and 10');
      err.statusCode = 400;
      throw err;
    }
    filters.criticality = crit;
  }

  if (queryFilters.urgency !== undefined) {
    const urg = Number(queryFilters.urgency);
    if (!Number.isInteger(urg) || urg < 1 || urg > 10) {
      const err = new Error('urgency filter must be an integer between 1 and 10');
      err.statusCode = 400;
      throw err;
    }
    filters.urgency = urg;
  }

  return jobRepo.findJobs(filters);
};

export const getJobById = async (id) => {
  const job = await jobRepo.findJobById(id);
  if (!job) {
    const err = new Error(`Maintenance job with ID "${id}" not found`);
    err.statusCode = 404;
    throw err;
  }
  return job;
};

export const updateJob = async (id, updatePayload) => {
  const existing = await jobRepo.findJobById(id);
  if (!existing) {
    const err = new Error(`Maintenance job with ID "${id}" not found`);
    err.statusCode = 404;
    throw err;
  }

  if (updatePayload.criticality !== undefined) {
    const crit = Number(updatePayload.criticality);
    if (!Number.isInteger(crit) || crit < 1 || crit > 10) {
      const err = new Error('criticality must be an integer between 1 and 10');
      err.statusCode = 400;
      throw err;
    }
    updatePayload.criticality = crit;
  }

  if (updatePayload.urgency !== undefined) {
    const urg = Number(updatePayload.urgency);
    if (!Number.isInteger(urg) || urg < 1 || urg > 10) {
      const err = new Error('urgency must be an integer between 1 and 10');
      err.statusCode = 400;
      throw err;
    }
    updatePayload.urgency = urg;
  }

  if (updatePayload.estimated_duration_minutes !== undefined) {
    const duration = Number(updatePayload.estimated_duration_minutes);
    if (!Number.isInteger(duration) || duration <= 0) {
      const err = new Error('estimated_duration_minutes must be an integer greater than 0');
      err.statusCode = 400;
      throw err;
    }
    updatePayload.estimated_duration_minutes = duration;
  }

  if (updatePayload.status !== undefined) {
    if (!VALID_STATUSES.includes(updatePayload.status)) {
      const err = new Error(`Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
  }

  return jobRepo.updateJob(id, updatePayload);
};
