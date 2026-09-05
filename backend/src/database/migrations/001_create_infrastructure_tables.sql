-- Migration: 001_create_infrastructure_tables.sql
-- Description: Create core railway network tables (stations, railway_sections, assets)

-- 1. Enable UUID generation if not available (pgcrypto or native gen_random_uuid in PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create custom ENUM types for departments and asset statuses
DO $$ BEGIN
    CREATE TYPE department_type AS ENUM (
        'ENGINEERING',
        'TRACTION_DISTRIBUTION',
        'SIGNAL_TELECOM'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_status AS ENUM (
        'ACTIVE',
        'UNDER_MAINTENANCE',
        'OUT_OF_SERVICE'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Stations Table
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 6) NULL,
    longitude NUMERIC(10, 6) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_stations_code UNIQUE (code)
);

-- 4. Railway Sections Table
-- A section represents the physical track segment between two stations/locations
-- ON DELETE RESTRICT ensures infrastructure is not accidentally deleted
CREATE TABLE IF NOT EXISTS railway_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    from_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    to_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    length_km NUMERIC(8, 2) NOT NULL,
    track_count INTEGER NOT NULL DEFAULT 1,
    electrified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_railway_sections_code UNIQUE (section_code),
    CONSTRAINT chk_railway_sections_distinct_stations CHECK (from_station_id <> to_station_id),
    CONSTRAINT chk_railway_sections_length_positive CHECK (length_km > 0),
    CONSTRAINT chk_railway_sections_track_count_positive CHECK (track_count > 0)
);

-- 5. Assets Table
-- Physical infrastructure components situated within railway sections
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code VARCHAR(64) NOT NULL,
    asset_type VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    section_id UUID NOT NULL REFERENCES railway_sections(id) ON DELETE RESTRICT,
    department department_type NOT NULL,
    criticality INTEGER NOT NULL,
    status asset_status NOT NULL DEFAULT 'ACTIVE',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_assets_asset_code UNIQUE (asset_code),
    CONSTRAINT chk_assets_criticality_range CHECK (criticality >= 1 AND criticality <= 10)
);

-- 6. Indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_stations_code ON stations(code);
CREATE INDEX IF NOT EXISTS idx_railway_sections_section_code ON railway_sections(section_code);
CREATE INDEX IF NOT EXISTS idx_railway_sections_from_station ON railway_sections(from_station_id);
CREATE INDEX IF NOT EXISTS idx_railway_sections_to_station ON railway_sections(to_station_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_section_id ON assets(section_id);
CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
