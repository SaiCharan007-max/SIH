import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

export const seedStationsData = [
  {
    code: 'FIC-STN-A',
    name: 'Station Alpha',
    latitude: 28.613900,
    longitude: 77.209000
  },
  {
    code: 'FIC-STN-B',
    name: 'Station Beta',
    latitude: 28.650000,
    longitude: 77.280000
  },
  {
    code: 'FIC-STN-C',
    name: 'Station Gamma',
    latitude: 28.720000,
    longitude: 77.280000
  },
  {
    code: 'FIC-STN-D',
    name: 'Station Delta',
    latitude: 28.650000,
    longitude: 77.380000
  },
  {
    code: 'FIC-STN-E',
    name: 'Station Epsilon',
    latitude: 28.650000,
    longitude: 77.490000
  }
];

export const seedSectionsData = [
  {
    section_code: 'SEC-A-B',
    name: 'Alpha-Beta Main Line',
    from_station_code: 'FIC-STN-A',
    to_station_code: 'FIC-STN-B',
    length_km: 15.40,
    track_count: 2,
    electrified: true
  },
  {
    section_code: 'SEC-B-C',
    name: 'Beta-Gamma Branch Line',
    from_station_code: 'FIC-STN-B',
    to_station_code: 'FIC-STN-C',
    length_km: 12.80,
    track_count: 1,
    electrified: true
  },
  {
    section_code: 'SEC-B-D',
    name: 'Beta-Delta Chord Line',
    from_station_code: 'FIC-STN-B',
    to_station_code: 'FIC-STN-D',
    length_km: 18.20,
    track_count: 2,
    electrified: true
  },
  {
    section_code: 'SEC-D-E',
    name: 'Delta-Epsilon Freight Corridor',
    from_station_code: 'FIC-STN-D',
    to_station_code: 'FIC-STN-E',
    length_km: 22.10,
    track_count: 2,
    electrified: true
  }
];

export const seedAssetsData = [
  {
    asset_code: 'AST-ENG-TRK-01',
    asset_type: 'track',
    name: 'Up Line Ballasted Track Km 4-8',
    section_code: 'SEC-A-B',
    department: 'ENGINEERING',
    criticality: 8,
    status: 'ACTIVE',
    metadata: {
      sleeper_type: 'PSC',
      rail_weight_kg_m: 60,
      last_tamped: '2026-01-15'
    }
  },
  {
    asset_code: 'AST-ENG-TRN-01',
    asset_type: 'turnout',
    name: '1 in 12 Curved Turnout Pt 102B',
    section_code: 'SEC-B-C',
    department: 'ENGINEERING',
    criticality: 9,
    status: 'ACTIVE',
    metadata: {
      crossing_type: 'CMS',
      operating_speed_kmh: 30
    }
  },
  {
    asset_code: 'AST-TRD-OHE-01',
    asset_type: 'OHE',
    name: '25kV AC Catenary Sub-Sector Beta-Delta',
    section_code: 'SEC-B-D',
    department: 'TRACTION_DISTRIBUTION',
    criticality: 7,
    status: 'ACTIVE',
    metadata: {
      voltage_kv: 25,
      tension_length_m: 1400,
      wire_type: 'copper-cadmium'
    }
  },
  {
    asset_code: 'AST-SNT-SIG-01',
    asset_type: 'signal',
    name: 'Beta Up Advance Starter Signal S-21',
    section_code: 'SEC-A-B',
    department: 'SIGNAL_TELECOM',
    criticality: 10,
    status: 'ACTIVE',
    metadata: {
      aspect_count: 4,
      lamp_type: 'LED',
      interlocking: 'Electronic'
    }
  },
  {
    asset_code: 'AST-SNT-TC-01',
    asset_type: 'track circuit',
    name: 'Audio Frequency Track Circuit AFTC-42',
    section_code: 'SEC-D-E',
    department: 'SIGNAL_TELECOM',
    criticality: 8,
    status: 'ACTIVE',
    metadata: {
      frequency_khz: 2.3,
      block_boundary: false
    }
  }
];

export const seedCrewsData = [
  {
    crew_code: 'CREW-ENG-01',
    department: 'ENGINEERING',
    name: 'Alpha Section P-Way Gang 1',
    capacity: 1,
    active: true
  },
  {
    crew_code: 'CREW-ENG-02',
    department: 'ENGINEERING',
    name: 'Track Machine & Tamping Crew',
    capacity: 2,
    active: true
  },
  {
    crew_code: 'CREW-TRD-01',
    department: 'TRACTION_DISTRIBUTION',
    name: 'Beta OHE Tower Wagon Team',
    capacity: 1,
    active: true
  },
  {
    crew_code: 'CREW-TRD-02',
    department: 'TRACTION_DISTRIBUTION',
    name: 'Power Distribution Inspection Unit',
    capacity: 1,
    active: true
  },
  {
    crew_code: 'CREW-SNT-01',
    department: 'SIGNAL_TELECOM',
    name: 'Electronic Interlocking Maintenance Team',
    capacity: 1,
    active: true
  },
  {
    crew_code: 'CREW-SNT-02',
    department: 'SIGNAL_TELECOM',
    name: 'Track Circuit & Axle Counter Squad',
    capacity: 1,
    active: true
  }
];

export const seedJobsData = [
  // Engineering Jobs (5)
  {
    job_code: 'JOB-ENG-001',
    department: 'ENGINEERING',
    asset_code: 'AST-ENG-TRK-01',
    section_code: 'SEC-A-B',
    work_type: 'TRACK_INSPECTION',
    description: 'Ultrasonic flaw detection testing on Up Line rail joints',
    estimated_duration_minutes: 120,
    criticality: 6,
    urgency: 5,
    overdue_days: 0,
    status: 'PENDING',
    requires_track_block: true,
    requires_power_shutdown: false,
    requires_signal_shutdown: false,
    requested_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    crew_code: 'CREW-ENG-01',
    resources: [
      { resource_type: 'EQUIPMENT', resource_name: 'USFD Testing Trolley', quantity: 1 }
    ]
  },
  {
    job_code: 'JOB-ENG-002',
    department: 'ENGINEERING',
    asset_code: 'AST-ENG-TRK-01',
    section_code: 'SEC-A-B',
    work_type: 'RAIL_REPLACEMENT',
    description: 'Emergency replacement of 12m defective rail section at Km 6.2',
    estimated_duration_minutes: 240,
    criticality: 9,
    urgency: 9,
    overdue_days: 3,
    status: 'PENDING',
    requires_track_block: true,
    requires_power_shutdown: false,
    requires_signal_shutdown: false,
    requested_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    deadline: new Date(Date.now() - 3 * 86400000).toISOString(),
    crew_code: 'CREW-ENG-02',
    resources: [
      { resource_type: 'EQUIPMENT', resource_name: 'Abrasive Rail Cutter', quantity: 2 },
      { resource_type: 'MATERIAL', resource_name: '60kg UIC Rail 13m', quantity: 1 }
    ]
  },
  {
    job_code: 'JOB-ENG-003',
    department: 'ENGINEERING',
    asset_code: 'AST-ENG-TRN-01',
    section_code: 'SEC-B-C',
    work_type: 'TURNOUT_MAINTENANCE',
    description: 'Reconditioning of CMS crossing and switch rail clearance adjustment',
    estimated_duration_minutes: 180,
    criticality: 8,
    urgency: 7,
    overdue_days: 0,
    status: 'PLANNED',
    requires_track_block: true,
    requires_power_shutdown: false,
    requires_signal_shutdown: true,
    requested_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    planned_start: new Date(Date.now() + 1 * 86400000).toISOString(),
    planned_end: new Date(Date.now() + 1 * 86400000 + 180 * 60000).toISOString(),
    crew_code: 'CREW-ENG-01',
    resources: [
      { resource_type: 'EQUIPMENT', resource_name: 'Portable Rail Grinder', quantity: 1 }
    ]
  },
  {
    job_code: 'JOB-ENG-004',
    department: 'ENGINEERING',
    asset_code: 'AST-ENG-TRN-01',
    section_code: 'SEC-B-C',
    work_type: 'TURNOUT_MAINTENANCE',
    description: 'Visual inspection and lubricating of turnout slide chairs',
    estimated_duration_minutes: 60,
    criticality: 4,
    urgency: 3,
    overdue_days: 0,
    status: 'PENDING',
    requires_track_block: false,
    requires_power_shutdown: false,
    requires_signal_shutdown: false,
    requested_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    crew_code: null,
    resources: []
  },
  {
    job_code: 'JOB-ENG-005',
    department: 'ENGINEERING',
    asset_code: 'AST-ENG-TRK-01',
    section_code: 'SEC-A-B',
    work_type: 'SLEEPER_REPLACEMENT',
    description: 'Casual renewal of cracked PSC sleepers between Km 5.0 and 5.4',
    estimated_duration_minutes: 210,
    criticality: 7,
    urgency: 6,
    overdue_days: 1,
    status: 'PENDING',
    requires_track_block: true,
    requires_power_shutdown: false,
    requires_signal_shutdown: false,
    requested_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    deadline: new Date(Date.now() - 1 * 86400000).toISOString(),
    crew_code: null,
    resources: [
      { resource_type: 'MATERIAL', resource_name: 'PSC Sleepers', quantity: 20 }
    ]
  },

  // Traction Distribution (TRD) Jobs (4)
  {
    job_code: 'JOB-TRD-001',
    department: 'TRACTION_DISTRIBUTION',
    asset_code: 'AST-TRD-OHE-01',
    section_code: 'SEC-B-D',
    work_type: 'OHE_INSPECTION',
    description: 'Current collection test and contact wire stagger check with tower wagon',
    estimated_duration_minutes: 120,
    criticality: 7,
    urgency: 5,
    overdue_days: 0,
    status: 'PENDING',
    requires_track_block: true,
    requires_power_shutdown: true,
    requires_signal_shutdown: false,
    requested_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 6 * 86400000).toISOString(),
    crew_code: 'CREW-TRD-01',
    resources: [
      { resource_type: 'EQUIPMENT', resource_name: '4-Wheeler OHE Tower Wagon', quantity: 1 }
    ]
  },
  {
    job_code: 'JOB-TRD-002',
    department: 'TRACTION_DISTRIBUTION',
    asset_code: 'AST-TRD-OHE-01',
    section_code: 'SEC-B-D',
    work_type: 'OHE_MAINTENANCE',
    description: 'Replacement of worn cantilever insulator assembly and dropper realignment',
    estimated_duration_minutes: 240,
    criticality: 9,
    urgency: 8,
    overdue_days: 2,
    status: 'PENDING',
    requires_track_block: true,
    requires_power_shutdown: true,
    requires_signal_shutdown: false,
    requested_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    deadline: new Date(Date.now() - 2 * 86400000).toISOString(),
    crew_code: 'CREW-TRD-01',
    resources: [
      { resource_type: 'EQUIPMENT', resource_name: 'Discharge Rods & Earthing Set', quantity: 4 },
      { resource_type: 'MATERIAL', resource_name: 'Composite Insulators 25kV', quantity: 6 }
    ]
  },
  {
    job_code: 'JOB-TRD-003',
    department: 'TRACTION_DISTRIBUTION',
    asset_code: 'AST-TRD-OHE-01',
    section_code: 'SEC-B-D',
    work_type: 'TRACTION_EQUIPMENT_MAINTENANCE',
    description: 'Periodic maintenance of section insulator and neutral section assembly',
    estimated_duration_minutes: 150,
    criticality: 6,
    urgency: 4,
    overdue_days: 0,
    status: 'PENDING',
    requires_track_block: false,
    requires_power_shutdown: true,
    requires_signal_shutdown: false,
    requested_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 8 * 86400000).toISOString(),
    crew_code: 'CREW-TRD-02',
    resources: []
  },
  {
    job_code: 'JOB-TRD-004',
    department: 'TRACTION_DISTRIBUTION',
    asset_code: 'AST-TRD-OHE-01',
    section_code: 'SEC-B-D',
    work_type: 'OHE_MAINTENANCE',
    description: 'Tension length auto-tensioning device (ATD) weight balance check',
    estimated_duration_minutes: 90,
    criticality: 5,
    urgency: 3,
    overdue_days: 0,
    status: 'PENDING',
    requires_track_block: false,
    requires_power_shutdown: false,
    requires_signal_shutdown: false,
    requested_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    crew_code: null,
    resources: []
  },

  // Signal & Telecom (S&T) Jobs (4)
  {
    job_code: 'JOB-SNT-001',
    department: 'SIGNAL_TELECOM',
    asset_code: 'AST-SNT-SIG-01',
    section_code: 'SEC-A-B',
    work_type: 'SIGNAL_MAINTENANCE',
    description: 'Urgent LED aspect module replacement for yellow aspect and cable insulation test',
    estimated_duration_minutes: 60,
    criticality: 10,
    urgency: 9,
    overdue_days: 1,
    status: 'PENDING',
    requires_track_block: false,
    requires_power_shutdown: false,
    requires_signal_shutdown: true,
    requested_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    deadline: new Date(Date.now() - 1 * 86400000).toISOString(),
    crew_code: 'CREW-SNT-01',
    resources: [
      { resource_type: 'MATERIAL', resource_name: 'LED Signal Aspect Unit (Yellow)', quantity: 1 },
      { resource_type: 'EQUIPMENT', resource_name: 'Digital Multimeter / Megger', quantity: 1 }
    ]
  },
  {
    job_code: 'JOB-SNT-002',
    department: 'SIGNAL_TELECOM',
    asset_code: 'AST-SNT-SIG-01',
    section_code: 'SEC-A-B',
    work_type: 'SIGNAL_MAINTENANCE',
    description: 'Quarterly signal post cleaning, focus calibration and visibility check',
    estimated_duration_minutes: 45,
    criticality: 4,
    urgency: 3,
    overdue_days: 0,
    status: 'PENDING',
    requires_track_block: false,
    requires_power_shutdown: false,
    requires_signal_shutdown: false,
    requested_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
    crew_code: null,
    resources: []
  },
  {
    job_code: 'JOB-SNT-003',
    department: 'SIGNAL_TELECOM',
    asset_code: 'AST-SNT-TC-01',
    section_code: 'SEC-D-E',
    work_type: 'TRACK_CIRCUIT_MAINTENANCE',
    description: 'Audio frequency track circuit tuning unit inspection and bond wire replacement',
    estimated_duration_minutes: 120,
    criticality: 8,
    urgency: 8,
    overdue_days: 0,
    status: 'PENDING',
    requires_track_block: true,
    requires_power_shutdown: false,
    requires_signal_shutdown: true,
    requested_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    crew_code: 'CREW-SNT-02',
    resources: [
      { resource_type: 'EQUIPMENT', resource_name: 'AFTC Frequency Shunt Tester', quantity: 1 },
      { resource_type: 'MATERIAL', resource_name: 'Stainless Steel Bond Wires', quantity: 10 }
    ]
  },
  {
    job_code: 'JOB-SNT-004',
    department: 'SIGNAL_TELECOM',
    asset_code: 'AST-SNT-TC-01',
    section_code: 'SEC-D-E',
    work_type: 'POINT_MACHINE_MAINTENANCE',
    description: 'Electromechanical point motor stroke adjustment, obstacle test, and friction clutch check',
    estimated_duration_minutes: 90,
    criticality: 8,
    urgency: 6,
    overdue_days: 0,
    status: 'PENDING',
    requires_track_block: true,
    requires_power_shutdown: false,
    requires_signal_shutdown: true,
    requested_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 4 * 86400000).toISOString(),
    crew_code: null,
    resources: [
      { resource_type: 'EQUIPMENT', resource_name: 'Point Machine Obstacle Gauge', quantity: 1 }
    ]
  }
];

export const seedStations = async (client) => {
  const stationMap = new Map();

  for (const stn of seedStationsData) {
    const res = await client.query(
      `INSERT INTO stations (code, name, latitude, longitude)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, code`,
      [stn.code, stn.name, stn.latitude, stn.longitude]
    );
    stationMap.set(res.rows[0].code, res.rows[0].id);
  }

  return stationMap;
};

export const seedSections = async (client, stationMap) => {
  const sectionMap = new Map();

  for (const sec of seedSectionsData) {
    const fromStationId = stationMap.get(sec.from_station_code);
    const toStationId = stationMap.get(sec.to_station_code);

    if (!fromStationId || !toStationId) {
      throw new Error(`Invalid station references for section ${sec.section_code}`);
    }

    const res = await client.query(
      `INSERT INTO railway_sections 
       (section_code, name, from_station_id, to_station_id, length_km, track_count, electrified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (section_code) DO UPDATE
       SET name = EXCLUDED.name,
           from_station_id = EXCLUDED.from_station_id,
           to_station_id = EXCLUDED.to_station_id,
           length_km = EXCLUDED.length_km,
           track_count = EXCLUDED.track_count,
           electrified = EXCLUDED.electrified,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, section_code`,
      [
        sec.section_code,
        sec.name,
        fromStationId,
        toStationId,
        sec.length_km,
        sec.track_count,
        sec.electrified
      ]
    );
    sectionMap.set(res.rows[0].section_code, res.rows[0].id);
  }

  return sectionMap;
};

export const seedAssets = async (client, sectionMap) => {
  const assetMap = new Map();

  for (const ast of seedAssetsData) {
    const sectionId = sectionMap.get(ast.section_code);

    if (!sectionId) {
      throw new Error(`Section not found for asset ${ast.asset_code}`);
    }

    const res = await client.query(
      `INSERT INTO assets 
       (asset_code, asset_type, name, section_id, department, criticality, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (asset_code) DO UPDATE
       SET asset_type = EXCLUDED.asset_type,
           name = EXCLUDED.name,
           section_id = EXCLUDED.section_id,
           department = EXCLUDED.department,
           criticality = EXCLUDED.criticality,
           status = EXCLUDED.status,
           metadata = EXCLUDED.metadata,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, asset_code`,
      [
        ast.asset_code,
        ast.asset_type,
        ast.name,
        sectionId,
        ast.department,
        ast.criticality,
        ast.status,
        JSON.stringify(ast.metadata)
      ]
    );
    assetMap.set(res.rows[0].asset_code, res.rows[0].id);
  }

  return assetMap;
};

export const seedCrews = async (client) => {
  const crewMap = new Map();

  for (const crew of seedCrewsData) {
    const res = await client.query(
      `INSERT INTO crews (crew_code, department, name, capacity, active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (crew_code) DO UPDATE
       SET department = EXCLUDED.department,
           name = EXCLUDED.name,
           capacity = EXCLUDED.capacity,
           active = EXCLUDED.active,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, crew_code`,
      [crew.crew_code, crew.department, crew.name, crew.capacity, crew.active]
    );
    crewMap.set(res.rows[0].crew_code, res.rows[0].id);
  }

  return crewMap;
};

export const seedJobs = async (client, sectionMap, assetMap, crewMap) => {
  for (const job of seedJobsData) {
    const sectionId = sectionMap.get(job.section_code);
    const assetId = assetMap.get(job.asset_code);

    if (!sectionId || !assetId) {
      throw new Error(`Missing section or asset for job ${job.job_code}`);
    }

    const res = await client.query(
      `INSERT INTO maintenance_jobs (
        job_code, department, asset_id, section_id, work_type, description,
        estimated_duration_minutes, criticality, urgency, overdue_days,
        status, requires_track_block, requires_power_shutdown, requires_signal_shutdown,
        requested_at, deadline, planned_start, planned_end
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (job_code) DO UPDATE
      SET department = EXCLUDED.department,
          asset_id = EXCLUDED.asset_id,
          section_id = EXCLUDED.section_id,
          work_type = EXCLUDED.work_type,
          description = EXCLUDED.description,
          estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
          criticality = EXCLUDED.criticality,
          urgency = EXCLUDED.urgency,
          overdue_days = EXCLUDED.overdue_days,
          status = EXCLUDED.status,
          requires_track_block = EXCLUDED.requires_track_block,
          requires_power_shutdown = EXCLUDED.requires_power_shutdown,
          requires_signal_shutdown = EXCLUDED.requires_signal_shutdown,
          deadline = EXCLUDED.deadline,
          planned_start = EXCLUDED.planned_start,
          planned_end = EXCLUDED.planned_end,
          updated_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [
        job.job_code,
        job.department,
        assetId,
        sectionId,
        job.work_type,
        job.description,
        job.estimated_duration_minutes,
        job.criticality,
        job.urgency,
        job.overdue_days,
        job.status,
        job.requires_track_block,
        job.requires_power_shutdown,
        job.requires_signal_shutdown,
        job.requested_at,
        job.deadline,
        job.planned_start || null,
        job.planned_end || null
      ]
    );

    const jobId = res.rows[0].id;

    // Seed assignments if crew specified
    if (job.crew_code && crewMap.has(job.crew_code)) {
      const crewId = crewMap.get(job.crew_code);
      const existingAssign = await client.query(
        'SELECT 1 FROM maintenance_job_assignments WHERE job_id = $1 AND crew_id = $2',
        [jobId, crewId]
      );
      if (existingAssign.rowCount === 0) {
        await client.query(
          `INSERT INTO maintenance_job_assignments (job_id, crew_id, is_primary)
           VALUES ($1, $2, true)`,
          [jobId, crewId]
        );
      }
    }

    // Seed resources
    if (job.resources && job.resources.length > 0) {
      for (const resItem of job.resources) {
        const existingRes = await client.query(
          'SELECT 1 FROM maintenance_job_resources WHERE job_id = $1 AND resource_name = $2',
          [jobId, resItem.resource_name]
        );
        if (existingRes.rowCount === 0) {
          await client.query(
            `INSERT INTO maintenance_job_resources (job_id, resource_type, resource_name, quantity)
             VALUES ($1, $2, $3, $4)`,
            [jobId, resItem.resource_type, resItem.resource_name, resItem.quantity]
          );
        }
      }
    }
  }
};

export const seedTrainsData = [
  {
    train_number: 'TRN-12001',
    name: 'Alpha-Epsilon Shatabdi Express',
    train_type: 'SUPERFAST',
    priority: 'HIGH',
    source_station_code: 'FIC-STN-A',
    destination_station_code: 'FIC-STN-E'
  },
  {
    train_number: 'TRN-12002',
    name: 'Epsilon-Alpha Shatabdi Return',
    train_type: 'SUPERFAST',
    priority: 'HIGH',
    source_station_code: 'FIC-STN-E',
    destination_station_code: 'FIC-STN-A'
  },
  {
    train_number: 'TRN-22435',
    name: 'Vande Bharat Express',
    train_type: 'SUPERFAST',
    priority: 'CRITICAL',
    source_station_code: 'FIC-STN-A',
    destination_station_code: 'FIC-STN-D'
  },
  {
    train_number: 'TRN-22436',
    name: 'Vande Bharat Return',
    train_type: 'SUPERFAST',
    priority: 'CRITICAL',
    source_station_code: 'FIC-STN-D',
    destination_station_code: 'FIC-STN-A'
  },
  {
    train_number: 'TRN-14055',
    name: 'Brahmaputra Mail',
    train_type: 'EXPRESS',
    priority: 'NORMAL',
    source_station_code: 'FIC-STN-A',
    destination_station_code: 'FIC-STN-C'
  },
  {
    train_number: 'TRN-14056',
    name: 'Brahmaputra Mail Return',
    train_type: 'EXPRESS',
    priority: 'NORMAL',
    source_station_code: 'FIC-STN-C',
    destination_station_code: 'FIC-STN-A'
  },
  {
    train_number: 'TRN-54311',
    name: 'Alpha-Delta Passenger',
    train_type: 'PASSENGER',
    priority: 'LOW',
    source_station_code: 'FIC-STN-A',
    destination_station_code: 'FIC-STN-D'
  },
  {
    train_number: 'TRN-54312',
    name: 'Delta-Alpha Passenger',
    train_type: 'PASSENGER',
    priority: 'LOW',
    source_station_code: 'FIC-STN-D',
    destination_station_code: 'FIC-STN-A'
  },
  {
    train_number: 'TRN-64501',
    name: 'Beta-Gamma Suburban Commuter',
    train_type: 'PASSENGER',
    priority: 'NORMAL',
    source_station_code: 'FIC-STN-B',
    destination_station_code: 'FIC-STN-C'
  },
  {
    train_number: 'TRN-BOXN-01',
    name: 'Coal Heavy Freight Rake 88A',
    train_type: 'FREIGHT',
    priority: 'LOW',
    source_station_code: 'FIC-STN-D',
    destination_station_code: 'FIC-STN-A'
  },
  {
    train_number: 'TRN-BCN-02',
    name: 'Foodgrain Bulk Freight 42B',
    train_type: 'FREIGHT',
    priority: 'LOW',
    source_station_code: 'FIC-STN-A',
    destination_station_code: 'FIC-STN-E'
  }
];

export const seedRoutesData = [
  { train_number: 'TRN-22435', route_name: 'Alpha to Delta Morning Run', service_date: '2026-09-10' },
  { train_number: 'TRN-12001', route_name: 'Alpha to Epsilon Shatabdi Run', service_date: '2026-09-10' },
  { train_number: 'TRN-14055', route_name: 'Alpha to Gamma Express Run', service_date: '2026-09-10' },
  { train_number: 'TRN-54311', route_name: 'Alpha to Delta Passenger Run', service_date: '2026-09-10' },
  { train_number: 'TRN-BCN-02', route_name: 'Alpha to Epsilon Freight Run', service_date: '2026-09-10' },
  { train_number: 'TRN-12002', route_name: 'Epsilon to Alpha Afternoon Shatabdi', service_date: '2026-09-10' },
  { train_number: 'TRN-64501', route_name: 'Beta to Gamma Afternoon Commuter', service_date: '2026-09-10' },
  { train_number: 'TRN-BOXN-01', route_name: 'Delta to Alpha Coal Run', service_date: '2026-09-10' }
];

export const seedMovementsData = [
  // SEC-A-B movements on 2026-09-10 creating realistic operational gaps:
  // Gap 1: 08:00 - 09:30 (90 min free)
  // Movement 1: 09:30 - 09:45 (TRN-22435)
  // Gap 2: 09:45 - 10:15 (30 min free)
  // Movement 2: 10:15 - 10:30 (TRN-12001)
  // Gap 3: 10:30 - 11:00 (30 min free)
  // Movement 3: 11:00 - 11:20 (TRN-14055)
  // Gap 4: 11:20 - 12:10 (50 min free)
  // Movement 4: 12:10 - 12:30 (TRN-54311)
  // Gap 5: 12:30 - 13:00 (30 min free)
  // Movement 5: 13:00 - 13:20 (TRN-BCN-02)
  // Gap 6: 13:20 - 14:15 (55 min free)
  // Movement 6: 14:15 - 14:35 (TRN-12002)
  // Gap 7: 14:35 - 15:00 (25 min free)
  // Restriction: 15:00 - 16:00
  // Gap 8: 16:00 - 18:00 (120 min free)
  {
    train_number: 'TRN-22435',
    section_code: 'SEC-A-B',
    sequence_number: 1,
    entry_time: '2026-09-10T09:30:00.000Z',
    exit_time: '2026-09-10T09:45:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-22435',
    section_code: 'SEC-B-D',
    sequence_number: 2,
    entry_time: '2026-09-10T09:50:00.000Z',
    exit_time: '2026-09-10T10:10:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-12001',
    section_code: 'SEC-A-B',
    sequence_number: 1,
    entry_time: '2026-09-10T10:15:00.000Z',
    exit_time: '2026-09-10T10:30:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-12001',
    section_code: 'SEC-B-D',
    sequence_number: 2,
    entry_time: '2026-09-10T10:35:00.000Z',
    exit_time: '2026-09-10T10:55:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-12001',
    section_code: 'SEC-D-E',
    sequence_number: 3,
    entry_time: '2026-09-10T11:00:00.000Z',
    exit_time: '2026-09-10T11:25:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-14055',
    section_code: 'SEC-A-B',
    sequence_number: 1,
    entry_time: '2026-09-10T11:00:00.000Z',
    exit_time: '2026-09-10T11:20:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-14055',
    section_code: 'SEC-B-C',
    sequence_number: 2,
    entry_time: '2026-09-10T11:35:00.000Z',
    exit_time: '2026-09-10T11:55:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-54311',
    section_code: 'SEC-A-B',
    sequence_number: 1,
    entry_time: '2026-09-10T12:10:00.000Z',
    exit_time: '2026-09-10T12:30:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-54311',
    section_code: 'SEC-B-D',
    sequence_number: 2,
    entry_time: '2026-09-10T12:35:00.000Z',
    exit_time: '2026-09-10T13:00:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-BCN-02',
    section_code: 'SEC-A-B',
    sequence_number: 1,
    entry_time: '2026-09-10T13:00:00.000Z',
    exit_time: '2026-09-10T13:20:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-BCN-02',
    section_code: 'SEC-B-D',
    sequence_number: 2,
    entry_time: '2026-09-10T13:25:00.000Z',
    exit_time: '2026-09-10T13:50:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-BCN-02',
    section_code: 'SEC-D-E',
    sequence_number: 3,
    entry_time: '2026-09-10T14:00:00.000Z',
    exit_time: '2026-09-10T14:30:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-12002',
    section_code: 'SEC-A-B',
    sequence_number: 1,
    entry_time: '2026-09-10T14:15:00.000Z',
    exit_time: '2026-09-10T14:35:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-64501',
    section_code: 'SEC-B-C',
    sequence_number: 1,
    entry_time: '2026-09-10T14:00:00.000Z',
    exit_time: '2026-09-10T14:20:00.000Z',
    status: 'SCHEDULED'
  },
  {
    train_number: 'TRN-BOXN-01',
    section_code: 'SEC-B-D',
    sequence_number: 1,
    entry_time: '2026-09-10T15:00:00.000Z',
    exit_time: '2026-09-10T15:30:00.000Z',
    status: 'SCHEDULED'
  }
];

export const seedFreightForecastsData = [
  {
    section_code: 'SEC-A-B',
    forecast_date: '2026-09-10',
    expected_entry_time: '2026-09-10T09:50:00.000Z',
    expected_exit_time: '2026-09-10T10:10:00.000Z',
    expected_train_count: 1,
    confidence: 0.850,
    source: 'CONTROL_OFFICE_FORECAST'
  },
  {
    section_code: 'SEC-B-D',
    forecast_date: '2026-09-10',
    expected_entry_time: '2026-09-10T11:30:00.000Z',
    expected_exit_time: '2026-09-10T12:00:00.000Z',
    expected_train_count: 1,
    confidence: 0.800,
    source: 'CONTROL_OFFICE_FORECAST'
  }
];

export const seedCorridorAvailabilityData = [
  {
    section_code: 'SEC-A-B',
    availability_date: '2026-09-10',
    start_time: '2026-09-10T15:00:00.000Z',
    end_time: '2026-09-10T16:00:00.000Z',
    status: 'RESTRICTED',
    reason: 'Alpha station yard turnout renewal caution order (speed restricted to 15 km/h)',
    source: 'OPERATIONAL_BASELINE'
  },
  {
    section_code: 'SEC-B-D',
    availability_date: '2026-09-10',
    start_time: '2026-09-10T16:30:00.000Z',
    end_time: '2026-09-10T17:30:00.000Z',
    status: 'UNAVAILABLE',
    reason: 'Power isolation test on auxiliary transformer',
    source: 'OPERATIONAL_BASELINE'
  }
];

export const seedTrains = async (client, stationMap) => {
  const trainMap = new Map();
  for (const t of seedTrainsData) {
    const srcId = stationMap.get(t.source_station_code);
    const destId = stationMap.get(t.destination_station_code);
    const res = await client.query(
      `INSERT INTO trains (train_number, name, train_type, priority, source_station_id, destination_station_id)
       VALUES ($1, $2, $3::train_type_enum, $4::train_priority_enum, $5, $6)
       ON CONFLICT (train_number) DO UPDATE
       SET name = EXCLUDED.name,
           train_type = EXCLUDED.train_type,
           priority = EXCLUDED.priority,
           source_station_id = EXCLUDED.source_station_id,
           destination_station_id = EXCLUDED.destination_station_id,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, train_number`,
      [t.train_number, t.name, t.train_type, t.priority, srcId, destId]
    );
    trainMap.set(res.rows[0].train_number, res.rows[0].id);
  }
  return trainMap;
};

export const seedRoutes = async (client, trainMap) => {
  const routeMap = new Map();
  for (const r of seedRoutesData) {
    const trainId = trainMap.get(r.train_number);
    const res = await client.query(
      `INSERT INTO train_routes (train_id, route_name, service_date)
       VALUES ($1, $2, $3)
       RETURNING id, train_id`,
      [trainId, r.route_name, r.service_date]
    );
    routeMap.set(`${r.train_number}_${r.service_date}`, res.rows[0].id);
  }
  return routeMap;
};

export const seedMovements = async (client, routeMap, sectionMap) => {
  for (const m of seedMovementsData) {
    const routeId = routeMap.get(`${m.train_number}_2026-09-10`);
    const secId = sectionMap.get(m.section_code);
    if (!routeId || !secId) continue;

    await client.query(
      `INSERT INTO train_movements (
        train_route_id, section_id, sequence_number,
        entry_time, exit_time, scheduled_entry_time, scheduled_exit_time, status
      )
      VALUES ($1, $2, $3, $4, $5, $4, $5, $6::movement_status_enum)`,
      [routeId, secId, m.sequence_number, m.entry_time, m.exit_time, m.status]
    );
  }
};

export const seedFreight = async (client, sectionMap) => {
  for (const f of seedFreightForecastsData) {
    const secId = sectionMap.get(f.section_code);
    if (!secId) continue;
    await client.query(
      `INSERT INTO freight_forecasts (
        section_id, forecast_date, expected_entry_time, expected_exit_time,
        expected_train_count, confidence, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [secId, f.forecast_date, f.expected_entry_time, f.expected_exit_time, f.expected_train_count, f.confidence, f.source]
    );
  }
};

export const seedCorridor = async (client, sectionMap) => {
  for (const c of seedCorridorAvailabilityData) {
    const secId = sectionMap.get(c.section_code);
    if (!secId) continue;
    await client.query(
      `INSERT INTO corridor_availability (
        section_id, availability_date, start_time, end_time, status, reason, source
      )
      VALUES ($1, $2, $3, $4, $5::corridor_status_enum, $6, $7)`,
      [secId, c.availability_date, c.start_time, c.end_time, c.status, c.reason, c.source]
    );
  }
};

export const runSeed = async () => {
  console.log('--- Seeding Fictional Railway Network, Maintenance & Train Operations Data ---');
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    console.log('Seeding stations...');
    const stationMap = await seedStations(client);
    console.log(`Seeded ${stationMap.size} stations.`);

    console.log('Seeding railway sections...');
    const sectionMap = await seedSections(client, stationMap);
    console.log(`Seeded ${sectionMap.size} railway sections.`);

    console.log('Seeding assets...');
    const assetMap = await seedAssets(client, sectionMap);
    console.log(`Seeded ${assetMap.size} assets.`);

    console.log('Seeding crews...');
    const crewMap = await seedCrews(client);
    console.log(`Seeded ${crewMap.size} crews.`);

    console.log('Seeding maintenance jobs, assignments, and resources...');
    await seedJobs(client, sectionMap, assetMap, crewMap);
    console.log(`Seeded ${seedJobsData.length} maintenance jobs.`);

    console.log('Seeding trains...');
    const trainMap = await seedTrains(client, stationMap);
    console.log(`Seeded ${trainMap.size} trains.`);

    console.log('Seeding train routes...');
    const routeMap = await seedRoutes(client, trainMap);
    console.log(`Seeded ${routeMap.size} train routes.`);

    console.log('Seeding train movements...');
    await seedMovements(client, routeMap, sectionMap);
    console.log(`Seeded ${seedMovementsData.length} train movements.`);

    console.log('Seeding freight forecasts...');
    await seedFreight(client, sectionMap);
    console.log(`Seeded ${seedFreightForecastsData.length} freight forecasts.`);

    console.log('Seeding corridor availability & restrictions...');
    await seedCorridor(client, sectionMap);
    console.log(`Seeded ${seedCorridorAvailabilityData.length} corridor restrictions.`);

    await client.query('COMMIT');
    console.log('Database seeding completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding error:', err.message);
    throw err;
  } finally {
    await client.end();
  }
};

// Execute if run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
