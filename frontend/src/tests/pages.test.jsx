// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { Maintenance } from '../pages/Maintenance';
import { Planning } from '../pages/Planning';
import { Network } from '../pages/Network';
import { PlanComparison } from '../pages/PlanComparison';

describe('All 5 Frontend Pages Rendering & Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const mockJobs = [
      {
        id: 'j1',
        job_code: 'JOB-ENG-01',
        department: 'ENGINEERING',
        section_code: 'SEC-A-B',
        section_id: 'sec-1',
        asset_code: 'AST-01',
        work_type: 'Track Maintenance',
        duration_minutes: 120,
        status: 'PENDING',
      },
    ];

    const mockPriorities = {
      reference_date: '2026-09-10',
      total_jobs: 1,
      jobs: [
        {
          id: 'j1',
          job_code: 'JOB-ENG-01',
          department: 'ENGINEERING',
          section_code: 'SEC-A-B',
          section_id: 'sec-1',
          asset_code: 'AST-01',
          priority_score: 95.0,
          priority_level: 'CRITICAL',
          criticality: 9,
          urgency: 5,
          work_type: 'Track Maintenance',
          duration_minutes: 120,
          deadline: '2026-09-12',
          status: 'PENDING',
        },
      ],
    };

    const mockStations = [
      { id: 's1', code: 'FIC-STN-A', name: 'Delhi Jn' },
      { id: 's2', code: 'FIC-STN-B', name: 'Ghaziabad' },
    ];

    const mockSections = [
      {
        id: 'sec-1',
        section_code: 'SEC-A-B',
        name: 'Delhi - Ghaziabad Corridor',
        from_station_code: 'FIC-STN-A',
        to_station_code: 'FIC-STN-B',
        length_km: 12.5,
        track_count: 2,
        electrified: true,
      },
    ];

    const mockAssets = [
      {
        id: 'ast-1',
        section_id: 'sec-1',
        asset_code: 'AST-01',
        asset_name: 'Rail Track Segment 1',
        department: 'ENGINEERING',
      },
    ];

    const mockTrainMovements = [
      {
        id: 'tm-1',
        section_id: 'sec-1',
        train_number: '12004',
        train_name: 'Shatabdi Express',
        train_type: 'PASSENGER',
        entry_time: '08:00:00',
        exit_time: '08:30:00',
      },
    ];

    const mockRuns = {
      runs: [
        {
          id: 'run-1',
          run_code: 'RUN-001',
          plan_date: '2026-09-10',
          run_type: 'INITIAL',
          status: 'PROPOSED',
          metrics: {
            total_blocks: 1,
            jobs_scheduled: 1,
            jobs_unscheduled: 0,
            total_block_minutes: 120,
            block_savings_minutes: 60,
          },
        },
        {
          id: 'run-2',
          run_code: 'RUN-002',
          plan_date: '2026-09-10',
          run_type: 'REPLAN',
          status: 'PROPOSED',
          metrics: {
            total_blocks: 1,
            jobs_scheduled: 1,
            jobs_unscheduled: 0,
            total_block_minutes: 120,
            block_savings_minutes: 60,
          },
        },
      ],
    };

    const mockRunDetails = {
      run: {
        id: 'run-1',
        run_code: 'RUN-001',
        plan_date: '2026-09-10',
        status: 'PROPOSED',
        metrics: {
          total_blocks: 1,
          jobs_scheduled: 1,
          jobs_unscheduled: 0,
          total_block_minutes: 120,
          block_savings_minutes: 60,
        },
        blocks: [
          {
            id: 'b1',
            block_code: 'BLOCK-001',
            section_id: 'sec-1',
            section_code: 'SEC-A-B',
            start_time: '10:00:00',
            end_time: '12:00:00',
            status: 'PROPOSED',
            jobs: [
              {
                job_id: 'j1',
                job_code: 'JOB-ENG-01',
                department: 'ENGINEERING',
                planned_start: '10:00:00',
                planned_end: '12:00:00',
                estimated_duration_minutes: 120,
              },
            ],
          },
        ],
        unscheduled_jobs: [],
      },
    };

    const mockComparison = {
      old_run_id: 'run-1',
      new_run_id: 'run-2',
      summary: {
        jobs_moved: 0,
        jobs_unchanged: 1,
        jobs_newly_scheduled: 0,
        jobs_unscheduled: 0,
        blocks_changed: 0,
        blocks_unchanged: 1,
      },
      changes: [
        {
          job_id: 'j1',
          job_code: 'JOB-ENG-01',
          change: 'UNCHANGED',
          old_start: '10:00:00',
          old_end: '12:00:00',
          new_start: '10:00:00',
          new_end: '12:00:00',
        },
      ],
    };

    // Central fetch dispatcher mocking live API responses
    global.fetch = vi.fn().mockImplementation(async (url) => {
      const urlStr = String(url);
      let payload = { success: true, data: [] };

      if (urlStr.includes('/maintenance/priorities')) {
        payload = { success: true, data: mockPriorities };
      } else if (urlStr.includes('/maintenance/jobs')) {
        payload = { success: true, data: mockJobs };
      } else if (urlStr.includes('/stations')) {
        payload = { success: true, data: mockStations };
      } else if (urlStr.includes('/sections')) {
        payload = { success: true, data: mockSections };
      } else if (urlStr.includes('/assets')) {
        payload = { success: true, data: mockAssets };
      } else if (urlStr.includes('/train-movements')) {
        payload = { success: true, data: mockTrainMovements };
      } else if (urlStr.includes('/compare')) {
        payload = { success: true, data: mockComparison };
      } else if (urlStr.includes('/planning/runs/') && !urlStr.endsWith('/planning/runs')) {
        payload = { success: true, data: mockRunDetails };
      } else if (urlStr.includes('/planning/runs')) {
        payload = { success: true, data: mockRuns };
      }

      return {
        ok: true,
        json: async () => payload,
      };
    });
  });

  it('1. /dashboard renders operations center header, KPI strip, and runs history', async () => {
    render(
      <MemoryRouter>
        <Dashboard planDate="2026-09-10" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network Operations/i)).toBeInTheDocument();
      expect(screen.getAllByText('Maintenance Jobs').length).toBeGreaterThan(0);
      expect(screen.getByText('Critical Jobs')).toBeInTheDocument();
      expect(screen.getAllByText('Block Time').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Block Savings').length).toBeGreaterThan(0);
    });
  });

  it('2. /maintenance renders engineering work queue, compact filters, and data table', async () => {
    render(
      <MemoryRouter>
        <Maintenance planDate="2026-09-10" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Maintenance Work')).toBeInTheDocument();
      expect(
        screen.getByText('Prioritized maintenance requiring planning attention')
      ).toBeInTheDocument();
      expect(screen.getByText('JOB-ENG-01')).toBeInTheDocument();
      expect(screen.getByText('95.0')).toBeInTheDocument();
    });
  });

  it('3. /planning renders Daily Block Planning hero page with Gantt timeline and status', async () => {
    render(
      <MemoryRouter>
        <Planning planDate="2026-09-10" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Daily Block Planning')).toBeInTheDocument();
      expect(screen.getAllByText('PROPOSED').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/AI-generated proposal/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Generate Plan')).toBeInTheDocument();
      expect(screen.getByText('Simulate Disruption')).toBeInTheDocument();
      expect(screen.getByText('SEC-A-B')).toBeInTheDocument();
    });
  });

  it('4. /network renders logical topology, stations, and section inspector', async () => {
    render(
      <MemoryRouter>
        <Network planDate="2026-09-10" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Railway Network Topology')).toBeInTheDocument();
      expect(screen.getByText('Schematic Network Topology')).toBeInTheDocument();
      expect(screen.getByText('Double Track')).toBeInTheDocument();
      expect(screen.getByText('Installed Railway Assets')).toBeInTheDocument();
    });
  });

  it('5. /planning/compare renders plan comparison change management audit', async () => {
    render(
      <MemoryRouter>
        <PlanComparison planDate="2026-09-10" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Plan Comparison')).toBeInTheDocument();
      expect(screen.getByText('Base Plan')).toBeInTheDocument();
      expect(screen.getByText('Revised Plan')).toBeInTheDocument();
      expect(screen.getByText('Unchanged')).toBeInTheDocument();
      expect(screen.getByText('Rescheduled')).toBeInTheDocument();
      expect(screen.getByText('UNCHANGED')).toBeInTheDocument();
    });
  });
});
