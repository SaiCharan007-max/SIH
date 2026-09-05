/**
 * Centralized API Service for SIH26027 Railway Maintenance Planning System
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic request helper with robust error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to backend planning service. Ensure Node backend is running on port 5000.');
    }
    throw error;
  }
}

// 1. Maintenance & Priority
export const getMaintenanceJobs = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.department) query.append('department', params.department);
  if (params.section_id) query.append('section_id', params.section_id);
  if (params.status) query.append('status', params.status);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await request(`/maintenance/jobs${qs}`);
  return res.data || [];
};

export const getMaintenancePriorities = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.department) query.append('department', params.department);
  if (params.reference_date) query.append('reference_date', params.reference_date);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await request(`/maintenance/priorities${qs}`);
  return res.data || [];
};

// 2. Railway Infrastructure Network
export const getStations = async () => {
  const res = await request('/stations');
  return res.data || [];
};

export const getSections = async () => {
  const res = await request('/sections');
  return res.data || [];
};

export const getAssets = async () => {
  const res = await request('/assets');
  return res.data || [];
};

// 3. Train Operations
export const getTrainMovements = async (date = '2026-09-10') => {
  const res = await request(`/train-movements?date=${date}`);
  return res.data || [];
};

// 4. Block Planning & Optimization
export const generatePlan = async ({ plan_date, start_time = '06:00', end_time = '22:00' }) => {
  const res = await request('/planning/generate', {
    method: 'POST',
    body: JSON.stringify({
      plan_date,
      start_time,
      end_time,
    }),
  });
  return res.data;
};

export const getPlanningRuns = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.plan_date) query.append('plan_date', params.plan_date);
  if (params.limit) query.append('limit', params.limit);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await request(`/planning/runs${qs}`);
  return res.data?.runs || [];
};

export const getPlanningRun = async (runId) => {
  const res = await request(`/planning/runs/${runId}`);
  return res.data;
};

// 5. Dynamic Replanning & Disruption Recovery
export const replan = async ({ plan_date, event }) => {
  const res = await request('/planning/replan', {
    method: 'POST',
    body: JSON.stringify({
      plan_date,
      event,
    }),
  });
  return res.data;
};

export const comparePlanningRuns = async (runId, otherRunId) => {
  const res = await request(`/planning/runs/${runId}/compare/${otherRunId}`);
  return res.data;
};
