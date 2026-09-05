import { getPriorityConfig } from '../../config/priorityConfig.js';

/**
 * Normalizes criticality from 1-10 scale to 0.0-1.0
 */
export const normalizeCriticality = (criticality) => {
  const num = Number(criticality) || 1;
  return Math.max(0, Math.min(10, num)) / 10;
};

/**
 * Normalizes urgency from 1-10 scale to 0.0-1.0
 */
export const normalizeUrgency = (urgency) => {
  const num = Number(urgency) || 1;
  return Math.max(0, Math.min(10, num)) / 10;
};

/**
 * Normalizes overdue days with saturation threshold (default 30 days)
 */
export const normalizeOverdueDays = (overdueDays, saturationDays = 30) => {
  const days = Math.max(0, Number(overdueDays) || 0);
  if (days >= saturationDays) return 1.0;
  return Math.round((days / saturationDays) * 100) / 100;
};

/**
 * Calculates deadline proximity relative to reference date.
 * If deadline is past or today: score = 1.0
 * If missing: default neutral score (e.g. 0.20)
 * If future within window: linearly scaled from 1.0 down to baseline 0.05
 */
export const calculateDeadlineProximity = (deadline, referenceDate, windowDays = 14, defaultScore = 0.20) => {
  if (!deadline) {
    return defaultScore;
  }

  const deadlineMs = new Date(deadline).getTime();
  const refMs = new Date(referenceDate).getTime();

  if (isNaN(deadlineMs) || isNaN(refMs)) {
    return defaultScore;
  }

  const diffDays = (deadlineMs - refMs) / (1000 * 60 * 60 * 24);

  // Past deadline or due immediately
  if (diffDays <= 0) {
    return 1.0;
  }

  // Beyond our proximity horizon
  if (diffDays >= windowDays) {
    return 0.05;
  }

  // Linear interpolation: closer deadline -> higher score
  const score = 1.0 - (diffDays / windowDays) * (1.0 - 0.05);
  return Math.round(score * 100) / 100;
};

/**
 * Evaluates asset status risk score
 */
export const evaluateAssetStatusScore = (assetStatus, statusScoresMap) => {
  if (!assetStatus) return statusScoresMap.ACTIVE || 0.20;
  return statusScoresMap[assetStatus] ?? 0.20;
};

/**
 * Derives priority level string from numeric score
 */
export const derivePriorityLevel = (score, levelThresholds) => {
  if (score >= levelThresholds.CRITICAL) return 'CRITICAL';
  if (score >= levelThresholds.HIGH) return 'HIGH';
  if (score >= levelThresholds.MEDIUM) return 'MEDIUM';
  return 'LOW';
};

/**
 * Core Rule-Based Scorer (Pure Function)
 * Evaluates a single maintenance job deterministically.
 * 
 * @param {Object} job - Maintenance job data
 * @param {Date|string} referenceDate - Evaluation reference timestamp
 * @param {Object} [config] - Configurable weights and thresholds
 * @returns {Object} Scored job with breakdown and weights
 */
export const scoreJob = (job, referenceDate = new Date(), customConfig = {}) => {
  const config = getPriorityConfig(customConfig);
  const refDate = new Date(referenceDate);

  const critScore = normalizeCriticality(job.criticality);
  const urgScore = normalizeUrgency(job.urgency);
  const overdueScore = normalizeOverdueDays(job.overdue_days, config.thresholds.overdue_saturation_days);
  const deadlineScore = calculateDeadlineProximity(
    job.deadline,
    refDate,
    config.thresholds.deadline_window_days,
    config.thresholds.missing_deadline_default_score
  );
  const assetScore = evaluateAssetStatusScore(job.asset_status, config.assetStatusScores);

  const weights = config.weights;

  // Compute weighted composite score on 0-100 scale
  const composite = (
    weights.criticality * critScore +
    weights.urgency * urgScore +
    weights.overdue * overdueScore +
    weights.deadline_proximity * deadlineScore +
    weights.asset_status * assetScore
  ) * 100;

  // Clamp and round to 1 decimal place
  const boundedScore = Math.max(0.0, Math.min(100.0, composite));
  const roundedScore = Math.round(boundedScore * 10) / 10;
  const level = derivePriorityLevel(roundedScore, config.levels);

  return {
    job_id: job.id,
    job_code: job.job_code,
    department: job.department,
    asset_id: job.asset_id,
    asset_code: job.asset_code,
    asset_name: job.asset_name,
    asset_status: job.asset_status,
    section_id: job.section_id,
    section_code: job.section_code,
    work_type: job.work_type,
    description: job.description,
    estimated_duration_minutes: job.estimated_duration_minutes,
    deadline: job.deadline,
    status: job.status,
    requires_track_block: job.requires_track_block,
    requires_power_shutdown: job.requires_power_shutdown,
    requires_signal_shutdown: job.requires_signal_shutdown,
    priority_score: roundedScore,
    priority_level: level,
    breakdown: {
      criticality: critScore,
      urgency: urgScore,
      overdue: overdueScore,
      deadline_proximity: deadlineScore,
      asset_status: assetScore
    },
    weights: {
      criticality: weights.criticality,
      urgency: weights.urgency,
      overdue: weights.overdue,
      deadline_proximity: weights.deadline_proximity,
      asset_status: weights.asset_status
    }
  };
};

/**
 * Deterministic Comparator for Ranking Maintenance Jobs
 * Tie-breaker hierarchy:
 * 1. priority_score (descending)
 * 2. criticality (descending)
 * 3. urgency (descending)
 * 4. deadline (ascending / earlier first, nulls last)
 * 5. job_code (alphabetical ascending)
 */
export const compareScoredJobs = (a, b) => {
  // 1. Primary: Priority Score
  if (b.priority_score !== a.priority_score) {
    return b.priority_score - a.priority_score;
  }

  // 2. Tie-break: Raw Criticality
  const critA = a.breakdown?.criticality ?? 0;
  const critB = b.breakdown?.criticality ?? 0;
  if (critB !== critA) {
    return critB - critA;
  }

  // 3. Tie-break: Raw Urgency
  const urgA = a.breakdown?.urgency ?? 0;
  const urgB = b.breakdown?.urgency ?? 0;
  if (urgB !== urgA) {
    return urgB - urgA;
  }

  // 4. Tie-break: Earlier Deadline First
  if (a.deadline && b.deadline) {
    const diff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (diff !== 0) return diff;
  } else if (a.deadline && !b.deadline) {
    return -1;
  } else if (!a.deadline && b.deadline) {
    return 1;
  }

  // 5. Tie-break: Lexicographical job_code
  return (a.job_code || '').localeCompare(b.job_code || '');
};

/**
 * Scores and ranks a collection of maintenance jobs.
 * 
 * @param {Array<Object>} jobs - List of raw job records
 * @param {Date|string} referenceDate - Reference date for time-dependent features
 * @param {Object} [customConfig] - Optional configuration overrides
 * @returns {Array<Object>} Scored and sorted jobs
 */
export const rankJobs = (jobs = [], referenceDate = new Date(), customConfig = {}) => {
  const scored = jobs.map((job) => scoreJob(job, referenceDate, customConfig));
  return scored.sort(compareScoredJobs);
};

/**
 * Model Interface Contract (for Rule-based and future ML replacements)
 */
export const createPriorityModel = (customConfig = {}) => {
  return {
    modelType: 'RULE_BASED_WEIGHTED_SUM',
    score: (job, referenceDate) => scoreJob(job, referenceDate, customConfig),
    rank: (jobs, referenceDate) => rankJobs(jobs, referenceDate, customConfig)
  };
};
