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
  for (const ast of seedAssetsData) {
    const sectionId = sectionMap.get(ast.section_code);

    if (!sectionId) {
      throw new Error(`Section not found for asset ${ast.asset_code}`);
    }

    await client.query(
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
           updated_at = CURRENT_TIMESTAMP`,
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
  }
};

export const runSeed = async () => {
  console.log('--- Seeding Fictional Railway Network Data ---');
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
    await seedAssets(client, sectionMap);
    console.log(`Seeded ${seedAssetsData.length} assets.`);

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
