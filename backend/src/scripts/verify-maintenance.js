import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import app from '../app.js';

dotenv.config();

const { Client } = pg;
const TEST_PORT = 5098;
const BASE_URL = `http://localhost:${TEST_PORT}/api/maintenance/jobs`;

export const startTestServer = () => {
  return new Promise((resolve) => {
    const server = app.listen(TEST_PORT, () => {
      resolve(server);
    });
  });
};

export const getSeedIds = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const assetRes = await client.query("SELECT id, section_id, department FROM assets WHERE asset_code = 'AST-ENG-TRK-01'");
    const sectionRes = await client.query("SELECT id FROM railway_sections WHERE section_code = 'SEC-A-B'");
    const crewRes = await client.query("SELECT id FROM crews WHERE crew_code = 'CREW-ENG-01'");
    return {
      assetId: assetRes.rows[0].id,
      sectionId: sectionRes.rows[0].id,
      crewId: crewRes.rows[0].id
    };
  } finally {
    await client.end();
  }
};

export const runTests = async () => {
  console.log('=====================================================');
  console.log(' SIH26027 Maintenance Management Verification Suite');
  console.log('=====================================================');

  const server = await startTestServer();
  const { assetId, sectionId, crewId } = await getSeedIds();
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let createdJobId = null;

  try {
    // 1. Create maintenance job
    console.log('\n[TEST 1] Create maintenance job (POST /api/maintenance/jobs)...');
    const createRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_code: `TEST-JOB-${Date.now()}`,
        department: 'ENGINEERING',
        asset_id: assetId,
        section_id: sectionId,
        work_type: 'TRACK_INSPECTION',
        description: 'Comprehensive track geometry verification for prototype testing',
        estimated_duration_minutes: 180,
        criticality: 7,
        urgency: 6,
        requires_track_block: true
      })
    });
    const createData = await createRes.json();
    if (createRes.status === 201 && createData.success && createData.data.id) {
      createdJobId = createData.data.id;
      console.log(`[PASS] Job created successfully with ID: ${createdJobId}`);
    } else {
      throw new Error(`Failed to create job: ${JSON.stringify(createData)}`);
    }

    // 2. Retrieve maintenance jobs
    console.log('\n[TEST 2] Retrieve all maintenance jobs (GET /api/maintenance/jobs)...');
    const getAllRes = await fetch(BASE_URL);
    const getAllData = await getAllRes.json();
    if (getAllRes.status === 200 && getAllData.success && Array.isArray(getAllData.data) && getAllData.data.length > 0) {
      console.log(`[PASS] Retrieved ${getAllData.data.length} maintenance jobs successfully.`);
    } else {
      throw new Error(`Failed to retrieve jobs: ${JSON.stringify(getAllData)}`);
    }

    // 3. Retrieve a job by ID
    console.log('\n[TEST 3] Retrieve a job by ID (GET /api/maintenance/jobs/:id)...');
    const getOneRes = await fetch(`${BASE_URL}/${createdJobId}`);
    const getOneData = await getOneRes.json();
    if (getOneRes.status === 200 && getOneData.success && getOneData.data.id === createdJobId) {
      console.log(`[PASS] Retrieved job by ID: ${getOneData.data.job_code} (status: ${getOneData.data.status})`);
    } else {
      throw new Error(`Failed to retrieve job by ID: ${JSON.stringify(getOneData)}`);
    }

    // 4. Update a job
    console.log('\n[TEST 4] Update a job (PATCH /api/maintenance/jobs/:id)...');
    const patchRes = await fetch(`${BASE_URL}/${createdJobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'PLANNED',
        criticality: 9,
        urgency: 8
      })
    });
    const patchData = await patchRes.json();
    if (patchRes.status === 200 && patchData.success && patchData.data.status === 'PLANNED' && patchData.data.criticality === 9) {
      console.log(`[PASS] Updated job status to "${patchData.data.status}" and criticality to ${patchData.data.criticality}.`);
    } else {
      throw new Error(`Failed to update job: ${JSON.stringify(patchData)}`);
    }

    // 5. Filter by department
    console.log('\n[TEST 5] Filter jobs by department (GET ?department=ENGINEERING)...');
    const filterDeptRes = await fetch(`${BASE_URL}?department=ENGINEERING`);
    const filterDeptData = await filterDeptRes.json();
    const allEng = filterDeptData.data.every((j) => j.department === 'ENGINEERING');
    if (filterDeptRes.status === 200 && filterDeptData.success && allEng && filterDeptData.data.length > 0) {
      console.log(`[PASS] Department filter returned ${filterDeptData.data.length} jobs, all ENGINEERING.`);
    } else {
      throw new Error(`Department filter failed: ${JSON.stringify(filterDeptData)}`);
    }

    // 6. Filter by section
    console.log('\n[TEST 6] Filter jobs by section (GET ?section_id=...)...');
    const filterSecRes = await fetch(`${BASE_URL}?section_id=${sectionId}`);
    const filterSecData = await filterSecRes.json();
    const allSec = filterSecData.data.every((j) => j.section_id === sectionId);
    if (filterSecRes.status === 200 && filterSecData.success && allSec && filterSecData.data.length > 0) {
      console.log(`[PASS] Section filter returned ${filterSecData.data.length} jobs, all on target section.`);
    } else {
      throw new Error(`Section filter failed: ${JSON.stringify(filterSecData)}`);
    }

    // 7. Filter by status
    console.log('\n[TEST 7] Filter jobs by status (GET ?status=PENDING)...');
    const filterStatusRes = await fetch(`${BASE_URL}?status=PENDING`);
    const filterStatusData = await filterStatusRes.json();
    const allPending = filterStatusData.data.every((j) => j.status === 'PENDING');
    if (filterStatusRes.status === 200 && filterStatusData.success && allPending && filterStatusData.data.length > 0) {
      console.log(`[PASS] Status filter returned ${filterStatusData.data.length} jobs, all PENDING.`);
    } else {
      throw new Error(`Status filter failed: ${JSON.stringify(filterStatusData)}`);
    }

    // 8. Invalid criticality is rejected
    console.log('\n[TEST 8] Invalid criticality rejection (criticality = 15)...');
    const invCritRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_code: `INV-CRIT-${Date.now()}`,
        department: 'ENGINEERING',
        asset_id: assetId,
        section_id: sectionId,
        work_type: 'TRACK_INSPECTION',
        description: 'Test invalid criticality',
        estimated_duration_minutes: 60,
        criticality: 15,
        urgency: 5
      })
    });
    const invCritData = await invCritRes.json();
    if (invCritRes.status === 400 && !invCritData.success) {
      console.log(`[PASS] Rejected invalid criticality with HTTP 400: "${invCritData.error.message}"`);
    } else {
      throw new Error(`Expected HTTP 400 for invalid criticality, got ${invCritRes.status}`);
    }

    // 9. Invalid duration is rejected
    console.log('\n[TEST 9] Invalid duration rejection (duration = -30)...');
    const invDurRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_code: `INV-DUR-${Date.now()}`,
        department: 'ENGINEERING',
        asset_id: assetId,
        section_id: sectionId,
        work_type: 'TRACK_INSPECTION',
        description: 'Test invalid duration',
        estimated_duration_minutes: -30,
        criticality: 5,
        urgency: 5
      })
    });
    const invDurData = await invDurRes.json();
    if (invDurRes.status === 400 && !invDurData.success) {
      console.log(`[PASS] Rejected invalid duration with HTTP 400: "${invDurData.error.message}"`);
    } else {
      throw new Error(`Expected HTTP 400 for invalid duration, got ${invDurRes.status}`);
    }

    // 10. Nonexistent asset/section is rejected
    console.log('\n[TEST 10] Nonexistent asset rejection (asset_id = fake)...');
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const invAssetRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_code: `INV-AST-${Date.now()}`,
        department: 'ENGINEERING',
        asset_id: fakeId,
        section_id: sectionId,
        work_type: 'TRACK_INSPECTION',
        description: 'Test fake asset',
        estimated_duration_minutes: 60,
        criticality: 5,
        urgency: 5
      })
    });
    const invAssetData = await invAssetRes.json();
    if (invAssetRes.status === 400 && !invAssetData.success) {
      console.log(`[PASS] Rejected nonexistent asset with HTTP 400: "${invAssetData.error.message}"`);
    } else {
      throw new Error(`Expected HTTP 400 for nonexistent asset, got ${invAssetRes.status}`);
    }

    // 11. Crew assignment references valid jobs and crews
    console.log('\n[TEST 11] Crew assignment foreign-key verification...');
    // Valid assignment
    const validAssignRes = await client.query(
      `INSERT INTO maintenance_job_assignments (job_id, crew_id, is_primary)
       VALUES ($1, $2, true)
       RETURNING id`,
      [createdJobId, crewId]
    );
    console.log(`[PASS] Valid assignment created with ID: ${validAssignRes.rows[0].id}`);

    // Invalid assignment test: fake crew
    let fkRejected = false;
    try {
      await client.query(
        `INSERT INTO maintenance_job_assignments (job_id, crew_id, is_primary)
         VALUES ($1, $2, true)`,
        [createdJobId, fakeId]
      );
    } catch (err) {
      if (err.code === '23503') {
        fkRejected = true;
        console.log(`[PASS] Invalid crew ID correctly rejected by foreign-key constraint (23503).`);
      } else {
        throw err;
      }
    }
    if (!fkRejected) {
      throw new Error('Expected foreign-key constraint violation for invalid crew assignment');
    }

    console.log('\n=====================================================');
    console.log(' [SUCCESS] ALL 11 VERIFICATION CHECKS PASSED!');
    console.log('=====================================================');
  } finally {
    await client.end();
    server.close();
  }
};

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n[FAIL] Maintenance verification failed:', err);
      process.exit(1);
    });
}
