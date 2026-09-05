import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMaintenancePriorities,
  getPlanningRun,
  getPlanningRuns,
  getMaintenanceJobs,
  getStations,
  getSections,
  getAssets,
} from '../services/api';

describe('API Service Contracts & Unwrapping', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getMaintenancePriorities unwraps { data: { reference_date, total_jobs, jobs: [...] } } to jobs array', async () => {
    const mockPayload = {
      success: true,
      data: {
        reference_date: '2026-09-10',
        total_jobs: 2,
        jobs: [
          { job_code: 'JOB-01', priority_score: 90 },
          { job_code: 'JOB-02', priority_score: 80 },
        ],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    });

    const result = await getMaintenancePriorities({ reference_date: '2026-09-10' });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].job_code).toBe('JOB-01');
  });

  it('getPlanningRun unwraps { data: { run: { ... } } } to the run object directly', async () => {
    const mockPayload = {
      success: true,
      data: {
        run: {
          id: 'run-123',
          run_code: 'RUN-20260910-001',
          blocks: [{ block_code: 'BLK-01' }],
          metrics: { total_block_minutes: 240 },
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    });

    const result = await getPlanningRun('run-123');
    expect(result.id).toBe('run-123');
    expect(Array.isArray(result.blocks)).toBe(true);
    expect(result.blocks.length).toBe(1);
    expect(result.metrics.total_block_minutes).toBe(240);
  });

  it('getPlanningRuns unwraps { data: { runs: [...] } } to runs array', async () => {
    const mockPayload = {
      success: true,
      data: {
        runs: [{ id: 'run-1' }, { id: 'run-2' }],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    });

    const result = await getPlanningRuns({ plan_date: '2026-09-10' });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  it('getStations returns station array directly', async () => {
    const mockPayload = {
      success: true,
      data: [{ code: 'FIC-STN-A', name: 'Delhi' }],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    });

    const result = await getStations();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].code).toBe('FIC-STN-A');
  });
});
