-- Migration: 005_create_dynamic_replanning_tables.sql
-- Description: Create planning_runs and planning_events tables, and link maintenance_blocks to planning_runs

-- 1. Create Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'planning_run_type') THEN
        CREATE TYPE planning_run_type AS ENUM ('INITIAL', 'REPLAN');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'planning_run_status') THEN
        CREATE TYPE planning_run_status AS ENUM ('PROPOSED', 'SUPERSEDED', 'FAILED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'planning_event_type') THEN
        CREATE TYPE planning_event_type AS ENUM (
            'MAINTENANCE_OVERRUN',
            'TRAIN_DELAY',
            'TRAIN_CANCELLATION',
            'EMERGENCY_MAINTENANCE',
            'CREW_UNAVAILABLE',
            'CORRIDOR_RESTRICTION_CHANGE'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'planning_event_status') THEN
        CREATE TYPE planning_event_status AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');
    END IF;
END $$;

-- 2. Create planning_runs table
CREATE TABLE IF NOT EXISTS planning_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_code VARCHAR(50) UNIQUE NOT NULL,
    plan_date DATE NOT NULL,
    run_type planning_run_type NOT NULL DEFAULT 'INITIAL',
    parent_run_id UUID REFERENCES planning_runs(id) ON DELETE SET NULL,
    status planning_run_status NOT NULL DEFAULT 'PROPOSED',
    reason TEXT,
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_planning_runs_date ON planning_runs (plan_date);
CREATE INDEX IF NOT EXISTS idx_planning_runs_status ON planning_runs (status);
CREATE INDEX IF NOT EXISTS idx_planning_runs_parent ON planning_runs (parent_run_id);

-- 3. Create planning_events table
CREATE TABLE IF NOT EXISTS planning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_code VARCHAR(50) UNIQUE NOT NULL,
    event_type planning_event_type NOT NULL,
    event_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    plan_date DATE NOT NULL,
    section_id UUID REFERENCES railway_sections(id) ON DELETE SET NULL,
    job_id UUID REFERENCES maintenance_jobs(id) ON DELETE SET NULL,
    train_id UUID REFERENCES trains(id) ON DELETE SET NULL,
    crew_id UUID REFERENCES crews(id) ON DELETE SET NULL,
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    status planning_event_status NOT NULL DEFAULT 'RECEIVED',
    planning_run_id UUID REFERENCES planning_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_planning_events_date ON planning_events (plan_date);
CREATE INDEX IF NOT EXISTS idx_planning_events_type ON planning_events (event_type);
CREATE INDEX IF NOT EXISTS idx_planning_events_run ON planning_events (planning_run_id);

-- 4. Alter maintenance_blocks to link to planning_runs
ALTER TABLE maintenance_blocks 
ADD COLUMN IF NOT EXISTS planning_run_id UUID REFERENCES planning_runs(id) ON DELETE CASCADE;

-- Update unique constraint on block_code to allow same block code across different planning runs if needed,
-- or index planning_run_id
CREATE INDEX IF NOT EXISTS idx_maintenance_blocks_run_id ON maintenance_blocks (planning_run_id);
