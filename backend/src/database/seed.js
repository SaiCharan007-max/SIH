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

export const runSeed = async () => {
  console.log('--- Seeding Fictional Railway Network & Maintenance Data ---');
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
