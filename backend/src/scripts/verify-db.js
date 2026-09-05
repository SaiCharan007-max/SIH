import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

export const verifyConnection = async (client) => {
  const res = await client.query('SELECT current_database() AS db_name, NOW() AS server_time');
  console.log(`[PASS] Connected to database: "${res.rows[0].db_name}" at ${res.rows[0].server_time.toISOString()}`);
  return res.rows[0];
};

export const verifyTablesExist = async (client) => {
  const requiredTables = ['stations', 'railway_sections', 'assets', 'schema_migrations'];
  const res = await client.query(
    `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [requiredTables]
  );

  const foundTables = res.rows.map((r) => r.table_name);
  for (const table of requiredTables) {
    if (foundTables.includes(table)) {
      console.log(`[PASS] Table "${table}" exists.`);
    } else {
      throw new Error(`Required table "${table}" is missing from the database.`);
    }
  }
};

export const verifyForeignKeyConstraints = async (client) => {
  // Test 1: Inserting railway_section with non-existent station must fail with 23503 foreign_key_violation
  const fakeStationId = '00000000-0000-0000-0000-000000000000';
  let fkErrorCaught = false;

  await client.query('BEGIN');
  try {
    await client.query(
      `INSERT INTO railway_sections 
       (section_code, name, from_station_id, to_station_id, length_km)
       VALUES ('TEST-INVALID-FK', 'Test Section', $1, $1, 10.0)`,
      [fakeStationId]
    );
  } catch (err) {
    if (err.code === '23503' || err.code === '23514') {
      fkErrorCaught = true;
      console.log(`[PASS] Constraint check verified: invalid foreign key / self-connection rejected (${err.code}).`);
    } else {
      throw err;
    }
  } finally {
    await client.query('ROLLBACK');
  }

  if (!fkErrorCaught) {
    throw new Error('Foreign key / check constraint failed to reject invalid station reference.');
  }

  // Test 2: Valid relational join between stations, railway_sections, and assets
  const joinRes = await client.query(`
    SELECT 
      rs.section_code,
      rs.name AS section_name,
      st_from.code AS from_station_code,
      st_to.code AS to_station_code,
      a.asset_code,
      a.department,
      a.asset_type
    FROM railway_sections rs
    JOIN stations st_from ON rs.from_station_id = st_from.id
    JOIN stations st_to ON rs.to_station_id = st_to.id
    LEFT JOIN assets a ON a.section_id = rs.id
    ORDER BY rs.section_code, a.asset_code
  `);

  console.log(`[PASS] Relational joins across stations -> sections -> assets succeeded (${joinRes.rowCount} joined records).`);
};

export const verifySeedData = async (client) => {
  const stationCount = await client.query('SELECT COUNT(*) AS count FROM stations');
  const sectionCount = await client.query('SELECT COUNT(*) AS count FROM railway_sections');
  const assetCount = await client.query('SELECT COUNT(*) AS count FROM assets');

  console.log(`[PASS] Record counts:`);
  console.log(`       - Stations: ${stationCount.rows[0].count}`);
  console.log(`       - Railway Sections: ${sectionCount.rows[0].count}`);
  console.log(`       - Assets: ${assetCount.rows[0].count}`);

  const sampleQuery = await client.query(`
    SELECT 
      a.asset_code,
      a.name AS asset_name,
      a.department,
      a.criticality,
      a.status,
      rs.section_code,
      st_from.code || ' -> ' || st_to.code AS route
    FROM assets a
    JOIN railway_sections rs ON a.section_id = rs.id
    JOIN stations st_from ON rs.from_station_id = st_from.id
    JOIN stations st_to ON rs.to_station_id = st_to.id
    ORDER BY a.asset_code
  `);

  console.log('\n[INFO] Sample Seed Data:');
  console.table(sampleQuery.rows);
};

export const runVerification = async () => {
  console.log('==============================================');
  console.log(' SIH26027 Database Verification');
  console.log('==============================================');

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    await verifyConnection(client);
    await verifyTablesExist(client);
    await verifyForeignKeyConstraints(client);
    await verifySeedData(client);
    console.log('\n[SUCCESS] All database verification checks passed successfully!');
  } finally {
    await client.end();
  }
};

// Execute if run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runVerification()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n[FAIL] Database verification failed:', err);
      process.exit(1);
    });
}
