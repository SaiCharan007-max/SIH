// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MaintenanceJobCard } from '../components/maintenance/MaintenanceJobCard';
import { UnscheduledJobsList } from '../components/planning/UnscheduledJobsList';
import { PlanningPipelineBanner } from '../components/planning/PlanningPipelineBanner';
import { BlockDetailModal } from '../components/planning/BlockDetailModal';
import { JobDetailPanel } from '../components/maintenance/JobDetailPanel';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

describe('Frontend Component Tests', () => {
  it('MaintenanceJobCard renders code, department, priority score and criticality', () => {
    const mockJob = {
      job_id: 'test-123',
      job_code: 'JOB-ENG-001',
      department: 'ENGINEERING',
      section_code: 'SEC-A-B',
      asset_code: 'AST-TRK-01',
      priority_score: 84.5,
      priority_level: 'CRITICAL',
      criticality: 9,
      urgency: 8,
      duration_minutes: 120,
      status: 'PENDING',
    };

    render(<MaintenanceJobCard job={mockJob} />);

    expect(screen.getByText('JOB-ENG-001')).toBeInTheDocument();
    expect(screen.getByText('ENG')).toBeInTheDocument();
    expect(screen.getByText('84.5')).toBeInTheDocument();
    expect(screen.getByText('Level: CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('SEC-A-B')).toBeInTheDocument();
    expect(screen.getByText('120m')).toBeInTheDocument();
  });

  it('UnscheduledJobsList displays refusal diagnostic reason and details', () => {
    const mockUnscheduled = [
      {
        job_id: 'unsched-001',
        job_code: 'JOB-SNT-103',
        department: 'SIGNAL_TELECOM',
        priority_level: 'CRITICAL',
        duration_minutes: 90,
        reason: 'NO_FEASIBLE_WINDOW',
      },
    ];

    render(<UnscheduledJobsList unscheduledJobs={mockUnscheduled} />);

    expect(screen.getByText(/Unscheduled Maintenance Work \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('JOB-SNT-103')).toBeInTheDocument();
    expect(screen.getByText('NO_FEASIBLE_WINDOW')).toBeInTheDocument();
  });

  it('PlanningPipelineBanner renders 4 pipeline stages and decision-support text', () => {
    render(<PlanningPipelineBanner />);

    expect(screen.getByText('Maintenance Data')).toBeInTheDocument();
    expect(screen.getByText('Priority Engine')).toBeInTheDocument();
    expect(screen.getByText('Constraint Optimizer')).toBeInTheDocument();
    expect(screen.getByText('Proposed Block Plan')).toBeInTheDocument();
    expect(
      screen.getByText(/Priority scoring identifies what matters most/i)
    ).toBeInTheDocument();
  });

  it('BlockDetailModal slide-over panel displays block duration, workload, and savings', () => {
    const mockBlock = {
      id: 'blk-1',
      block_code: 'BLOCK-004',
      section_code: 'SEC-A-B',
      start_time: '12:00:00',
      end_time: '14:00:00',
      status: 'PROPOSED',
      jobs: [
        {
          job_id: 'j1',
          job_code: 'JOB-ENG-01',
          department: 'ENGINEERING',
          planned_start: '12:00:00',
          planned_end: '14:00:00',
          estimated_duration_minutes: 120,
        },
        {
          job_id: 'j2',
          job_code: 'JOB-TRD-01',
          department: 'TRACTION_DISTRIBUTION',
          planned_start: '12:00:00',
          planned_end: '13:30:00',
          estimated_duration_minutes: 90,
        },
        {
          job_id: 'j3',
          job_code: 'JOB-SNT-01',
          department: 'SIGNAL_TELECOM',
          planned_start: '12:00:00',
          planned_end: '13:00:00',
          estimated_duration_minutes: 60,
        },
      ],
    };

    render(<BlockDetailModal block={mockBlock} isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('BLOCK-004')).toBeInTheDocument();
    expect(screen.getByText('SEC-A-B')).toBeInTheDocument();
    expect(screen.getByText('120 min')).toBeInTheDocument(); // Duration
    expect(screen.getByText('270 min')).toBeInTheDocument(); // Workload (120+90+60)
    expect(screen.getByText('150 min')).toBeInTheDocument(); // Savings (270-120)
    expect(screen.getByText('JOB-ENG-01')).toBeInTheDocument();
    expect(screen.getByText('JOB-TRD-01')).toBeInTheDocument();
    expect(screen.getByText('JOB-SNT-01')).toBeInTheDocument();
  });

  it('JobDetailPanel slide drawer displays priority score and work details', () => {
    const mockJob = {
      job_code: 'JOB-ENG-09',
      department: 'ENGINEERING',
      priority_score: 92.4,
      priority_level: 'CRITICAL',
      criticality: 10,
      urgency: 5,
      overdue_days: 3,
      section_code: 'SEC-A-B',
      asset_code: 'AST-RAIL-01',
      work_type: 'Deep Ballast Screening',
      description: 'Critical ballast tamping and track alignment',
      duration_minutes: 180,
      status: 'PENDING',
    };

    render(<JobDetailPanel job={mockJob} isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('JOB-ENG-09')).toBeInTheDocument();
    expect(screen.getByText('92.4')).toBeInTheDocument();
    expect(screen.getByText('AST-RAIL-01')).toBeInTheDocument();
    expect(screen.getByText('Deep Ballast Screening')).toBeInTheDocument();
    expect(screen.getByText('+3d')).toBeInTheDocument();
    expect(screen.getByText('180 minutes')).toBeInTheDocument();
  });

  it('Badge renders expected label and styling variant', () => {
    render(<Badge variant="proposed">PROPOSED</Badge>);
    expect(screen.getByText('PROPOSED')).toBeInTheDocument();
  });

  it('EmptyState renders custom title and description', () => {
    render(<EmptyState title="No Records Available" description="Please adjust your criteria" />);
    expect(screen.getByText('No Records Available')).toBeInTheDocument();
    expect(screen.getByText('Please adjust your criteria')).toBeInTheDocument();
  });
});
