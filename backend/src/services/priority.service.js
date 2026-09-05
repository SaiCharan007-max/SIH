import { findJobs } from '../repositories/maintenanceJob.repository.js';
import { rankJobs } from './priority/priorityModel.js';

const VALID_DEPARTMENTS = ['ENGINEERING', 'TRACTION_DISTRIBUTION', 'SIGNAL_TELECOM'];
const VALID_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/**
 * Calculates priority rankings for pending maintenance jobs.
 * 
 * @param {Object} queryOptions - Filters including department, section_id, priority_level, reference_date
 * @returns {Object} Structured priority ranking payload
 */
export const getRankedMaintenanceJobs = async (queryOptions = {}) => {
  const { department, section_id, priority_level, reference_date } = queryOptions;

  if (department && !VALID_DEPARTMENTS.includes(department)) {
    const err = new Error(`Invalid department filter. Allowed: ${VALID_DEPARTMENTS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (priority_level && !VALID_LEVELS.includes(priority_level.toUpperCase())) {
    const err = new Error(`Invalid priority_level filter. Allowed: ${VALID_LEVELS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // Parse reference date or default to current date
  let refDate;
  if (reference_date) {
    refDate = new Date(reference_date);
    if (isNaN(refDate.getTime())) {
      const err = new Error('Invalid reference_date format. Expected ISO or YYYY-MM-DD');
      err.statusCode = 400;
      throw err;
    }
  } else {
    refDate = new Date();
  }

  // Build repository query filter (prioritize active/pending maintenance jobs)
  const repoFilters = {};
  if (department) repoFilters.department = department;
  if (section_id) repoFilters.section_id = section_id;

  const rawJobs = await findJobs(repoFilters);

  // We consider jobs that require scheduling / planning (status in PENDING or PLANNED)
  const candidateJobs = rawJobs.filter(
    (job) => job.status === 'PENDING' || job.status === 'PLANNED'
  );

  // Score and rank jobs using pure priority model
  let ranked = rankJobs(candidateJobs, refDate);

  // Apply priority_level filter if specified
  if (priority_level) {
    const targetLevel = priority_level.toUpperCase();
    ranked = ranked.filter((j) => j.priority_level === targetLevel);
  }

  return {
    reference_date: refDate.toISOString(),
    total_jobs: ranked.length,
    jobs: ranked
  };
};
