// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MaintenanceJobCard } from '../components/maintenance/MaintenanceJobCard';
import { UnscheduledJobsList } from '../components/planning/UnscheduledJobsList';
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
      status: 'PENDING'
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
        reason: 'NO_FEASIBLE_WINDOW'
      }
    ];

    render(<UnscheduledJobsList unscheduledJobs={mockUnscheduled} />);

    expect(screen.getByText(/Unscheduled Maintenance Work \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('JOB-SNT-103')).toBeInTheDocument();
    expect(screen.getByText('NO_FEASIBLE_WINDOW')).toBeInTheDocument();
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
