-- Migration: 002_create_maintenance_tables.sql
-- Description: Create maintenance-management domain tables (crews, maintenance_jobs, assignments, resources)

-- 1. Create Enums for Job Status and Work Types
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM (
        'PENDING',
        'PLANNED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_work_type AS ENUM (
        -- Engineering work types
        'TRACK_INSPECTION',
        'RAIL_REPLACEMENT',
        'SLEEPER_REPLACEMENT',
        'TURNOUT_MAINTENANCE',
        -- Traction Distribution work types
        'OHE_INSPECTION',
        'OHE_MAINTENANCE',
        'TRACTION_EQUIPMENT_MAINTENANCE',
        -- Signal & Telecom work types
        'SIGNAL_MAINTENANCE',
        'TRACK_CIRCUIT_MAINTENANCE',
        'POINT_MACHINE_MAINTENANCE'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Crews Table
CREATE TABLE IF NOT EXISTS crews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_code VARCHAR(64) NOT NULL,
    department department_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_crews_crew_code UNIQUE (crew_code),
    CONSTRAINT chk_crews_capacity_positive CHECK (capacity > 0)
);

-- 3. Maintenance Jobs Table
CREATE TABLE IF NOT EXISTS maintenance_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_code VARCHAR(64) NOT NULL,
    department department_type NOT NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    section_id UUID NOT NULL REFERENCES railway_sections(id) ON DELETE RESTRICT,
    work_type maintenance_work_type NOT NULL,
    description TEXT NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    criticality INTEGER NOT NULL,
    urgency INTEGER NOT NULL,
    overdue_days INTEGER NOT NULL DEFAULT 0,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMPTZ NULL,
    status job_status NOT NULL DEFAULT 'PENDING',
    requires_track_block BOOLEAN NOT NULL DEFAULT false,
    requires_power_shutdown BOOLEAN NOT NULL DEFAULT false,
    requires_signal_shutdown BOOLEAN NOT NULL DEFAULT false,
    planned_start TIMESTAMPTZ NULL,
    planned_end TIMESTAMPTZ NULL,
    actual_start TIMESTAMPTZ NULL,
    actual_end TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_maintenance_jobs_job_code UNIQUE (job_code),
    CONSTRAINT chk_jobs_duration_positive CHECK (estimated_duration_minutes > 0),
    CONSTRAINT chk_jobs_criticality_range CHECK (criticality >= 1 AND criticality <= 10),
    CONSTRAINT chk_jobs_urgency_range CHECK (urgency >= 1 AND urgency <= 10),
    CONSTRAINT chk_jobs_overdue_days_non_negative CHECK (overdue_days >= 0),
    CONSTRAINT chk_jobs_deadline_valid CHECK (deadline IS NULL OR deadline >= requested_at),
    CONSTRAINT chk_jobs_planned_dates_valid CHECK (planned_end IS NULL OR planned_start IS NULL OR planned_end >= planned_start),
    CONSTRAINT chk_jobs_actual_dates_valid CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end >= actual_start)
);

-- 4. Job Crew Assignments Table
CREATE TABLE IF NOT EXISTS maintenance_job_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE RESTRICT,
    crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMPTZ NULL,
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_assignments_release_valid CHECK (released_at IS NULL OR released_at >= assigned_at)
);

-- 5. Job Resource Requirements Table
CREATE TABLE IF NOT EXISTS maintenance_job_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE RESTRICT,
    resource_type VARCHAR(64) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_job_resources_quantity_positive CHECK (quantity > 0)
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_crews_department ON crews(department);
CREATE INDEX IF NOT EXISTS idx_crews_crew_code ON crews(crew_code);

CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_department ON maintenance_jobs(department);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_section_id ON maintenance_jobs(section_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_asset_id ON maintenance_jobs(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_status ON maintenance_jobs(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_deadline ON maintenance_jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_criticality ON maintenance_jobs(criticality);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_urgency ON maintenance_jobs(urgency);

CREATE INDEX IF NOT EXISTS idx_assignments_job_id ON maintenance_job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_assignments_crew_id ON maintenance_job_assignments(crew_id);

CREATE INDEX IF NOT EXISTS idx_job_resources_job_id ON maintenance_job_resources(job_id);
