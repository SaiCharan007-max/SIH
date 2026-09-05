-- Migration: 003_create_train_operations_tables.sql
-- Description: Create train operations domain tables (trains, train_routes, train_movements, freight_forecasts, corridor_availability)

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE train_type_enum AS ENUM (
        'PASSENGER',
        'EXPRESS',
        'SUPERFAST',
        'FREIGHT',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE train_priority_enum AS ENUM (
        'LOW',
        'NORMAL',
        'HIGH',
        'CRITICAL'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE movement_status_enum AS ENUM (
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'DELAYED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE corridor_status_enum AS ENUM (
        'AVAILABLE',
        'RESTRICTED',
        'UNAVAILABLE'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Trains Table
CREATE TABLE IF NOT EXISTS trains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_number VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    train_type train_type_enum NOT NULL,
    priority train_priority_enum NOT NULL DEFAULT 'NORMAL',
    source_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    destination_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_trains_train_number UNIQUE (train_number),
    CONSTRAINT chk_trains_distinct_endpoints CHECK (source_station_id <> destination_station_id)
);

-- 3. Train Routes Table
CREATE TABLE IF NOT EXISTS train_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id UUID NOT NULL REFERENCES trains(id) ON DELETE RESTRICT,
    route_name VARCHAR(255) NOT NULL,
    service_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Train Movements Table
CREATE TABLE IF NOT EXISTS train_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_route_id UUID NOT NULL REFERENCES train_routes(id) ON DELETE RESTRICT,
    section_id UUID NOT NULL REFERENCES railway_sections(id) ON DELETE RESTRICT,
    sequence_number INTEGER NOT NULL,
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ NOT NULL,
    scheduled_entry_time TIMESTAMPTZ NOT NULL,
    scheduled_exit_time TIMESTAMPTZ NOT NULL,
    actual_entry_time TIMESTAMPTZ NULL,
    actual_exit_time TIMESTAMPTZ NULL,
    status movement_status_enum NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_movements_seq_positive CHECK (sequence_number > 0),
    CONSTRAINT chk_movements_entry_exit CHECK (entry_time < exit_time),
    CONSTRAINT chk_movements_scheduled_entry_exit CHECK (scheduled_entry_time < scheduled_exit_time),
    CONSTRAINT chk_movements_actual_entry_exit CHECK (actual_exit_time IS NULL OR actual_entry_time IS NULL OR actual_exit_time >= actual_entry_time)
);

-- 5. Freight Forecasts Table
CREATE TABLE IF NOT EXISTS freight_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES railway_sections(id) ON DELETE RESTRICT,
    forecast_date DATE NOT NULL,
    expected_entry_time TIMESTAMPTZ NOT NULL,
    expected_exit_time TIMESTAMPTZ NOT NULL,
    expected_train_count INTEGER NOT NULL DEFAULT 1,
    confidence NUMERIC(4, 3) NOT NULL,
    source VARCHAR(64) NOT NULL DEFAULT 'CONTROL_OFFICE_FORECAST',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_freight_train_count_positive CHECK (expected_train_count > 0),
    CONSTRAINT chk_freight_confidence_range CHECK (confidence >= 0.000 AND confidence <= 1.000),
    CONSTRAINT chk_freight_times CHECK (expected_entry_time < expected_exit_time)
);

-- 6. Corridor Availability Table
CREATE TABLE IF NOT EXISTS corridor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES railway_sections(id) ON DELETE RESTRICT,
    availability_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status corridor_status_enum NOT NULL DEFAULT 'AVAILABLE',
    reason TEXT NULL,
    source VARCHAR(64) NOT NULL DEFAULT 'OPERATIONAL_BASELINE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_corridor_times CHECK (start_time < end_time)
);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_trains_train_number ON trains(train_number);
CREATE INDEX IF NOT EXISTS idx_trains_type ON trains(train_type);
CREATE INDEX IF NOT EXISTS idx_trains_priority ON trains(priority);

CREATE INDEX IF NOT EXISTS idx_train_routes_train_id ON train_routes(train_id);
CREATE INDEX IF NOT EXISTS idx_train_routes_service_date ON train_routes(service_date);

CREATE INDEX IF NOT EXISTS idx_train_movements_route_id ON train_movements(train_route_id);
CREATE INDEX IF NOT EXISTS idx_train_movements_section_id ON train_movements(section_id);
CREATE INDEX IF NOT EXISTS idx_train_movements_sched_entry ON train_movements(scheduled_entry_time);
CREATE INDEX IF NOT EXISTS idx_train_movements_sched_exit ON train_movements(scheduled_exit_time);
CREATE INDEX IF NOT EXISTS idx_train_movements_entry ON train_movements(entry_time);
CREATE INDEX IF NOT EXISTS idx_train_movements_exit ON train_movements(exit_time);

CREATE INDEX IF NOT EXISTS idx_freight_forecasts_section_id ON freight_forecasts(section_id);
CREATE INDEX IF NOT EXISTS idx_freight_forecasts_date ON freight_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_freight_forecasts_entry ON freight_forecasts(expected_entry_time);

CREATE INDEX IF NOT EXISTS idx_corridor_section_id ON corridor_availability(section_id);
CREATE INDEX IF NOT EXISTS idx_corridor_date ON corridor_availability(availability_date);
CREATE INDEX IF NOT EXISTS idx_corridor_start ON corridor_availability(start_time);
CREATE INDEX IF NOT EXISTS idx_corridor_end ON corridor_availability(end_time);
