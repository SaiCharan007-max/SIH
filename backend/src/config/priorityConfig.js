/**
 * Priority Scoring Configuration
 * Centralized, explainable weights and threshold parameters for SIH26027.
 * Prototype weights - not an official Indian Railways policy statement.
 */

export const DEFAULT_PRIORITY_WEIGHTS = Object.freeze({
  criticality: 0.30,
  urgency: 0.25,
  overdue: 0.20,
  deadline_proximity: 0.15,
  asset_status: 0.10
});

export const PRIORITY_THRESHOLDS = Object.freeze({
  overdue_saturation_days: 30,
  deadline_window_days: 14,
  missing_deadline_default_score: 0.20
});

export const ASSET_STATUS_SCORES = Object.freeze({
  OUT_OF_SERVICE: 1.00,
  UNDER_MAINTENANCE: 0.70,
  ACTIVE: 0.20
});

export const PRIORITY_LEVEL_THRESHOLDS = Object.freeze({
  CRITICAL: 80.0,
  HIGH: 60.0,
  MEDIUM: 40.0,
  LOW: 0.0
});

export const getPriorityConfig = (customOverrides = {}) => {
  return {
    weights: {
      ...DEFAULT_PRIORITY_WEIGHTS,
      ...(customOverrides.weights || {})
    },
    thresholds: {
      ...PRIORITY_THRESHOLDS,
      ...(customOverrides.thresholds || {})
    },
    assetStatusScores: {
      ...ASSET_STATUS_SCORES,
      ...(customOverrides.assetStatusScores || {})
    },
    levels: {
      ...PRIORITY_LEVEL_THRESHOLDS,
      ...(customOverrides.levels || {})
    }
  };
};
