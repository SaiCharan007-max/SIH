-- Migration: 004_create_maintenance_blocks_tables.sql
-- Description: Create maintenance_blocks and maintenance_block_jobs tables for daily block planning

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'block_status') THEN
        CREATE TYPE block_status AS ENUM ('PROPOSED', 'APPROVED', 'CANCELLED');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS maintenance_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_code VARCHAR(50) UNIQUE NOT NULL,
    section_id UUID NOT NULL REFERENCES railway_sections(id) ON DELETE RESTRICT,
    plan_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status block_status NOT NULL DEFAULT 'PROPOSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_maintenance_block_times CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS maintenance_block_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID NOT NULL REFERENCES maintenance_blocks(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE RESTRICT,
    planned_start TIME NOT NULL,
    planned_end TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_block_job UNIQUE (block_id, job_id),
    CONSTRAINT chk_block_job_times CHECK (planned_end > planned_start)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_blocks_section_date ON maintenance_blocks (section_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_blocks_plan_date ON maintenance_blocks (plan_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_blocks_status ON maintenance_blocks (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_block_jobs_block ON maintenance_block_jobs (block_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_block_jobs_job ON maintenance_block_jobs (job_id);
