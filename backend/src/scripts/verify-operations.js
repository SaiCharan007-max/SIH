import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import app from '../app.js';

dotenv.config();

const { Client } = pg;
const TEST_PORT = 5097;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

export const startTestServer = () => {
  return new Promise((resolve) => {
    const server = app.listen(TEST_PORT, () => {
      resolve(server);
    });
  });
};

export const getInfrastructureIds = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const stnA = await client.query("SELECT id FROM stations WHERE code = 'FIC-STN-A'");
    const stnB = await client.query("SELECT id FROM stations WHERE code = 'FIC-STN-B'");
    const secAB = await client.query("SELECT id FROM railway_sections WHERE section_code = 'SEC-A-B'");
    return {
      stationAId: stnA.rows[0].id,
      stationBId: stnB.rows[0].id,
      sectionABId: secAB.rows[0].id
    };
  } finally {
    await client.end();
  }
};

export const runOperationsTests = async () => {
  console.log('===========================================================');
  console.log(' SIH26027 Train Operations & Corridor Verification Suite');
  console.log('===========================================================');

  const server = await startTestServer();
  const { stationAId, stationBId, sectionABId } = await getInfrastructureIds();
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let createdTrainId = null;
  let createdRouteId = null;
  let createdMovementId = null;

  try {
    // 1. Create a train
    console.log('\n[TEST 1] Create a train (POST /api/trains)...');
    const trainNum = `TEST-TRN-${Date.now()}`;
    const createTrainRes = await fetch(`${BASE_URL}/trains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_number: trainNum,
        name: 'Rapid Express Test Service',
        train_type: 'EXPRESS',
        priority: 'HIGH',
        source_station_id: stationAId,
        destination_station_id: stationBId
      })
    });
    const createTrainData = await createTrainRes.json();
    if (createTrainRes.status === 201 && createTrainData.success && createTrainData.data.id) {
      createdTrainId = createTrainData.data.id;
      console.log(`[PASS] Created train ${trainNum} with ID: ${createdTrainId}`);
    } else {
      throw new Error(`Failed to create train: ${JSON.stringify(createTrainData)}`);
    }

    // 2. Create a train route
    console.log('\n[TEST 2] Create a train route (POST /api/train-routes)...');
    const createRouteRes = await fetch(`${BASE_URL}/train-routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_id: createdTrainId,
        route_name: 'Alpha-Beta Test Morning Leg',
        service_date: '2026-09-15'
      })
    });
    const createRouteData = await createRouteRes.json();
    if (createRouteRes.status === 201 && createRouteData.success && createRouteData.data.id) {
      createdRouteId = createRouteData.data.id;
      console.log(`[PASS] Created train route with ID: ${createdRouteId}`);
    } else {
      throw new Error(`Failed to create train route: ${JSON.stringify(createRouteData)}`);
    }

    // 3. Create train movements
    console.log('\n[TEST 3] Create train movement (POST /api/train-movements)...');
    const createMovRes = await fetch(`${BASE_URL}/train-movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_route_id: createdRouteId,
        section_id: sectionABId,
        sequence_number: 1,
        entry_time: '2026-09-15T08:15:00.000Z',
        exit_time: '2026-09-15T08:35:00.000Z',
        scheduled_entry_time: '2026-09-15T08:15:00.000Z',
        scheduled_exit_time: '2026-09-15T08:35:00.000Z',
        status: 'SCHEDULED'
      })
    });
    const createMovData = await createMovRes.json();
    if (createMovRes.status === 201 && createMovData.success && createMovData.data.id) {
      createdMovementId = createMovData.data.id;
      console.log(`[PASS] Created train movement with ID: ${createdMovementId}`);
    } else {
      throw new Error(`Failed to create train movement: ${JSON.stringify(createMovData)}`);
    }

    // 4. Retrieve movements by section
    console.log('\n[TEST 4] Retrieve movements by section (GET /api/train-movements?section_id=...)...');
    const secMovRes = await fetch(`${BASE_URL}/train-movements?section_id=${sectionABId}`);
    const secMovData = await secMovRes.json();
    const allMatchingSec = secMovData.data.every((m) => m.section_id === sectionABId);
    if (secMovRes.status === 200 && secMovData.success && allMatchingSec && secMovData.data.length > 0) {
      console.log(`[PASS] Retrieved ${secMovData.data.length} movements for section.`);
    } else {
      throw new Error(`Section filter failed: ${JSON.stringify(secMovData)}`);
    }

    // 5. Retrieve movements by date
    console.log('\n[TEST 5] Retrieve movements by date (GET /api/train-movements?date=2026-09-10)...');
    const dateMovRes = await fetch(`${BASE_URL}/train-movements?date=2026-09-10`);
    const dateMovData = await dateMovRes.json();
    if (dateMovRes.status === 200 && dateMovData.success && dateMovData.data.length > 0) {
      console.log(`[PASS] Retrieved ${dateMovData.data.length} movements on 2026-09-10.`);
    } else {
      throw new Error(`Date filter failed: ${JSON.stringify(dateMovData)}`);
    }

    // 6. Detect overlapping movements
    console.log('\n[TEST 6] Detect overlapping movements on section SEC-A-B between 10:00 and 11:30...');
    // In seed data on 2026-09-10:
    // TRN-12001 is 10:15 - 10:30
    // TRN-14055 is 11:00 - 11:20
    const availCheckRes = await fetch(
      `${BASE_URL}/corridor/availability?section_id=${sectionABId}&start_time=2026-09-10T10:00:00.000Z&end_time=2026-09-10T11:30:00.000Z`
    );
    const availCheckData = await availCheckRes.json();
    const overlappingTrains = availCheckData.data.scheduled_train_occupancies.map((t) => t.train_number);
    if (overlappingTrains.includes('TRN-12001') && overlappingTrains.includes('TRN-14055')) {
      console.log(`[PASS] Correctly detected overlapping trains: ${overlappingTrains.join(', ')}`);
    } else {
      throw new Error(`Failed to detect expected overlapping trains: ${JSON.stringify(availCheckData)}`);
    }

    // 7. Verify Exact Known Example for Free Corridor Windows
    // Requirement from problem statement:
    // Train A: 10:00-10:20
    // Train B: 10:45-11:05
    // Train C: 11:40-12:00
    // Horizon: 09:00-13:00
    // Expected Gaps:
    // 09:00 - 10:00 (60 min)
    // 10:20 - 10:45 (25 min)
    // 11:05 - 11:40 (35 min)
    // 12:00 - 13:00 (60 min)
    console.log('\n[TEST 7] Verify Exact Known Example Free Corridor Windows...');
    // Create dedicated test route and 3 movements
    const tempRouteRes = await fetch(`${BASE_URL}/train-routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_id: createdTrainId,
        route_name: 'Exact Example Validation Route',
        service_date: '2026-10-01'
      })
    });
    const tempRouteData = await tempRouteRes.json();
    const tempRouteId = tempRouteData.data.id;

    // Movement A: 10:00 - 10:20
    await fetch(`${BASE_URL}/train-movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_route_id: tempRouteId,
        section_id: sectionABId,
        sequence_number: 1,
        entry_time: '2026-10-01T10:00:00.000Z',
        exit_time: '2026-10-01T10:20:00.000Z'
      })
    });

    // Movement B: 10:45 - 11:05
    await fetch(`${BASE_URL}/train-movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_route_id: tempRouteId,
        section_id: sectionABId,
        sequence_number: 2,
        entry_time: '2026-10-01T10:45:00.000Z',
        exit_time: '2026-10-01T11:05:00.000Z'
      })
    });

    // Movement C: 11:40 - 12:00
    await fetch(`${BASE_URL}/train-movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_route_id: tempRouteId,
        section_id: sectionABId,
        sequence_number: 3,
        entry_time: '2026-10-01T11:40:00.000Z',
        exit_time: '2026-10-01T12:00:00.000Z'
      })
    });

    // Query 09:00 - 13:00 on 2026-10-01
    const exampleRes = await fetch(
      `${BASE_URL}/corridor/availability?section_id=${sectionABId}&start_time=2026-10-01T09:00:00.000Z&end_time=2026-10-01T13:00:00.000Z`
    );
    const exampleData = await exampleRes.json();
    const windows = exampleData.data.free_windows;

    console.log('[INFO] Calculated free windows for known benchmark:');
    windows.forEach((w, i) => {
      console.log(`       Window ${i + 1}: ${w.start_time.substring(11, 16)} -> ${w.end_time.substring(11, 16)} (${w.duration_minutes} mins)`);
    });

    if (
      windows.length === 4 &&
      windows[0].duration_minutes === 60 &&
      windows[1].duration_minutes === 25 &&
      windows[2].duration_minutes === 35 &&
      windows[3].duration_minutes === 60
    ) {
      console.log('[PASS] Exact benchmark verified: 09:00-10:00 (60m), 10:20-10:45 (25m), 11:05-11:40 (35m), 12:00-13:00 (60m).');
    } else {
      throw new Error(`Known gap example calculation mismatch: ${JSON.stringify(windows)}`);
    }

    // 8. Create freight forecast
    console.log('\n[TEST 8] Create freight forecast (POST /api/freight-forecasts)...');
    const createFreightRes = await fetch(`${BASE_URL}/freight-forecasts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section_id: sectionABId,
        forecast_date: '2026-09-12',
        expected_entry_time: '2026-09-12T16:00:00.000Z',
        expected_exit_time: '2026-09-12T16:30:00.000Z',
        expected_train_count: 2,
        confidence: 0.850,
        source: 'CONTROL_OFFICE_FORECAST'
      })
    });
    const createFreightData = await createFreightRes.json();
    if (createFreightRes.status === 201 && createFreightData.success && createFreightData.data.id) {
      console.log(`[PASS] Freight forecast created with ID: ${createFreightData.data.id}`);
    } else {
      throw new Error(`Failed to create freight forecast: ${JSON.stringify(createFreightData)}`);
    }

    // 9. Retrieve freight forecasts by section/date
    console.log('\n[TEST 9] Retrieve freight forecasts (GET /api/freight-forecasts?section_id=...&date=2026-09-10)...');
    const getFreightRes = await fetch(`${BASE_URL}/freight-forecasts?section_id=${sectionABId}&date=2026-09-10`);
    const getFreightData = await getFreightRes.json();
    if (getFreightRes.status === 200 && getFreightData.success && getFreightData.data.length > 0) {
      console.log(`[PASS] Retrieved ${getFreightData.data.length} freight forecasts.`);
    } else {
      throw new Error(`Failed to get freight forecasts: ${JSON.stringify(getFreightData)}`);
    }

    // 10. Create corridor restriction
    console.log('\n[TEST 10] Create corridor restriction (POST /api/corridor/availability)...');
    const createRestrRes = await fetch(`${BASE_URL}/corridor/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section_id: sectionABId,
        availability_date: '2026-09-15',
        start_time: '2026-09-15T09:00:00.000Z',
        end_time: '2026-09-15T10:00:00.000Z',
        status: 'UNAVAILABLE',
        reason: 'Bridge foundation scour inspection',
        source: 'DIVISIONAL_SAFETY_OFFICE'
      })
    });
    const createRestrData = await createRestrRes.json();
    if (createRestrRes.status === 201 && createRestrData.success && createRestrData.data.id) {
      console.log(`[PASS] Corridor restriction created with ID: ${createRestrData.data.id}`);
    } else {
      throw new Error(`Failed to create restriction: ${JSON.stringify(createRestrData)}`);
    }

    // 11. Corridor availability query respects restrictions
    console.log('\n[TEST 11] Corridor availability query respects restrictions...');
    const restrCheckRes = await fetch(
      `${BASE_URL}/corridor/availability?section_id=${sectionABId}&start_time=2026-09-15T08:00:00.000Z&end_time=2026-09-15T11:00:00.000Z`
    );
    const restrCheckData = await restrCheckRes.json();
    const hasRestriction = restrCheckData.data.corridor_restrictions.some(
      (r) => r.reason === 'Bridge foundation scour inspection'
    );
    // 09:00 - 10:00 is restricted, so it should not appear as a free window
    const freeSpans = restrCheckData.data.free_windows;
    const restrictedTimeContainedInFree = freeSpans.some((f) => {
      return (
        new Date(f.start_time) < new Date('2026-09-15T09:30:00.000Z') &&
        new Date(f.end_time) > new Date('2026-09-15T09:30:00.000Z')
      );
    });

    if (hasRestriction && !restrictedTimeContainedInFree) {
      console.log(`[PASS] Restriction recognized and successfully excluded from free windows.`);
    } else {
      throw new Error(`Restriction was not properly excluded: ${JSON.stringify(restrCheckData)}`);
    }

    // 12. Invalid time intervals are rejected
    console.log('\n[TEST 12] Invalid time interval rejection (start > end)...');
    const invTimeRes = await fetch(`${BASE_URL}/train-movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_route_id: createdRouteId,
        section_id: sectionABId,
        sequence_number: 1,
        entry_time: '2026-09-15T10:00:00.000Z',
        exit_time: '2026-09-15T09:00:00.000Z'
      })
    });
    const invTimeData = await invTimeRes.json();
    if (invTimeRes.status === 400 && !invTimeData.success) {
      console.log(`[PASS] Inverted times rejected with HTTP 400: "${invTimeData.error.message}"`);
    } else {
      throw new Error(`Expected HTTP 400 for inverted interval, got ${invTimeRes.status}`);
    }

    // 13. Invalid foreign keys are rejected
    console.log('\n[TEST 13] Invalid foreign key rejection (fake section_id)...');
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const invFkRes = await fetch(`${BASE_URL}/train-movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_route_id: createdRouteId,
        section_id: fakeId,
        sequence_number: 1,
        entry_time: '2026-09-15T09:00:00.000Z',
        exit_time: '2026-09-15T09:30:00.000Z'
      })
    });
    const invFkData = await invFkRes.json();
    if (invFkRes.status === 400 && !invFkData.success) {
      console.log(`[PASS] Nonexistent foreign key rejected with HTTP 400: "${invFkData.error.message}"`);
    } else {
      throw new Error(`Expected HTTP 400 for nonexistent section ID, got ${invFkRes.status}`);
    }

    console.log('\n===========================================================');
    console.log(' [SUCCESS] ALL 13 OPERATIONS VERIFICATION CHECKS PASSED!');
    console.log('===========================================================');
  } finally {
    await client.end();
    server.close();
  }
};

// Execute if run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runOperationsTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n[FAIL] Train Operations verification failed:', err);
      process.exit(1);
    });
}
