import { fileURLToPath } from 'url';
import app from '../app.js';
import pool from '../config/db.js';
import {
  buildPlanningSnapshot,
  validateOptimizerOutput,
  generateDailyPlan
} from '../services/planning.service.js';

const TEST_PORT = 5097;
const BASE_URL = `http://localhost:${TEST_PORT}/api/planning`;

export const startTestServer = () => {
  return new Promise((resolve) => {
    const server = app.listen(TEST_PORT, () => {
      resolve(server);
    });
  });
};

export const runPlanningTests = async () => {
  console.log('===========================================================');
  console.log(' SIH26027 Maintenance Block Planning & Optimization Suite');
  console.log('===========================================================');

  let server;
  try {
    server = await startTestServer();
    console.log(`\n[INIT] Test server running on port ${TEST_PORT}`);

    // TEST 1: Snapshot Generation
    console.log('\n[TEST 1] Assembling Normalized Planning Snapshot...');
    const snapshot = await buildPlanningSnapshot({
      planDate: '2026-09-10',
      startTime: '06:00',
      endTime: '22:00'
    });

    if (!snapshot || !snapshot.jobs || !snapshot.train_movements) {
      throw new Error('Failed to assemble planning snapshot');
    }
    console.log(`[PASS] Snapshot generated: ${snapshot.sections.length} sections, ${snapshot.jobs.length} jobs, ${snapshot.crews.length} crews, ${snapshot.train_movements.length} train movements.`);

    // TEST 2: Validate Output Logic (Unit-level check on safety rules)
    console.log('\n[TEST 2] Output Validation (Safety & Consistency)...');
    const firstJob = snapshot.jobs[0];
    const durM = firstJob.duration_minutes;
    const durEndH = 12 + Math.floor(durM / 60);
    const durEndM = durM % 60;
    const validEndTime = `${String(durEndH).padStart(2, '0')}:${String(durEndM).padStart(2, '0')}`;

    const mockPlan = {
      plan_date: '2026-09-10',
      status: 'PROPOSED',
      blocks: [
        {
          block_code: 'BLK-TEST-001',
          section_id: firstJob.section_id,
          start_time: '12:00',
          end_time: validEndTime,
          jobs: [
            {
              job_id: firstJob.job_id,
              start_time: '12:00',
              end_time: validEndTime
            }
          ]
        }
      ],
      unscheduled_jobs: snapshot.jobs.slice(1).map(j => ({ job_id: j.job_id, reason: 'NO_FEASIBLE_WINDOW' })),
      metrics: {
        jobs_considered: snapshot.jobs.length,
        jobs_scheduled: 1,
        jobs_unscheduled: snapshot.jobs.length - 1
      }
    };

    const isValid = validateOptimizerOutput(snapshot, mockPlan);
    if (isValid) {
      console.log('[PASS] Output validation passed for structurally valid plan.');
    }

    // TEST 3: Validation Error on Duplicate Jobs
    console.log('\n[TEST 3] Validation catches duplicate job in multiple blocks...');
    try {
      const duplicatePlan = {
        plan_date: '2026-09-10',
        blocks: [
          {
            block_code: 'BLK-A',
            start_time: '12:00',
            end_time: validEndTime,
            jobs: [{ job_id: firstJob.job_id, start_time: '12:00', end_time: validEndTime }]
          },
          {
            block_code: 'BLK-B',
            start_time: '12:00',
            end_time: validEndTime,
            jobs: [{ job_id: firstJob.job_id, start_time: '12:00', end_time: validEndTime }]
          }
        ],
        unscheduled_jobs: []
      };
      validateOptimizerOutput(snapshot, duplicatePlan);
      throw new Error('Validation should have thrown for duplicate jobs');
    } catch (err) {
      if (err.message.includes('scheduled multiple times')) {
        console.log(`[PASS] Correctly rejected duplicate job assignment: "${err.message}".`);
      } else {
        throw err;
      }
    }

    // TEST 4: Direct Call to Python Optimizer via Planning Service
    console.log('\n[TEST 4] Invoking Daily Planning Optimization via HTTP POST /api/planning/generate...');
    const response = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_date: '2026-09-10',
        start_time: '06:00',
        end_time: '22:00'
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API returned HTTP ${response.status}: ${errBody}`);
    }

    const json = await response.json();
    const plan = json.data;

    console.log(`[PASS] Plan successfully generated and persisted!`);
    console.log(`       Status: ${plan.status}`);
    console.log(`       Blocks Created: ${plan.blocks.length}`);
    console.log(`       Jobs Considered: ${plan.metrics.jobs_considered}`);
    console.log(`       Jobs Scheduled: ${plan.metrics.jobs_scheduled}`);
    console.log(`       Jobs Unscheduled: ${plan.metrics.jobs_unscheduled}`);
    console.log(`       Total Maintenance Minutes: ${plan.metrics.total_maintenance_minutes}`);
    console.log(`       Total Block Minutes: ${plan.metrics.total_block_minutes}`);
    console.log(`       Consolidation Savings: ${plan.metrics.block_savings_minutes} minutes`);

    // TEST 5: Verify Persistence in PostgreSQL
    console.log('\n[TEST 5] Verifying Database Persistence...');
    const dbBlocks = await pool.query('SELECT * FROM maintenance_blocks WHERE plan_date = $1', ['2026-09-10']);
    const dbBlockJobs = await pool.query(
      'SELECT bj.* FROM maintenance_block_jobs bj JOIN maintenance_blocks b ON bj.block_id = b.id WHERE b.plan_date = $1',
      ['2026-09-10']
    );

    if (dbBlocks.rows.length === 0) {
      throw new Error('No maintenance_blocks found in database for 2026-09-10');
    }
    console.log(`[PASS] Verified ${dbBlocks.rows.length} maintenance blocks and ${dbBlockJobs.rows.length} block jobs in PostgreSQL.`);

    // TEST 6: Coordinated Multi-Department Block Demonstration (SEC-A12)
    console.log('\n[TEST 6] Demonstrating Joint Multi-Department Block Consolidation (SIH Demo Scenario)...');
    const demoSnapshot = {
      plan_date: '2026-09-10',
      planning_window: { start: '12:00', end: '18:00' },
      sections: [{ section_id: 'SEC-A12', section_code: 'A-B' }],
      jobs: [
        {
          job_id: 'JOB-ENG-01',
          section_id: 'SEC-A12',
          department: 'ENGINEERING',
          duration_minutes: 120,
          priority_score: 92.0,
          requires_track_block: true,
          crew_ids: ['CREW-ENG-01']
        },
        {
          job_id: 'JOB-TRD-01',
          section_id: 'SEC-A12',
          department: 'TRACTION_DISTRIBUTION',
          duration_minutes: 90,
          priority_score: 84.0,
          requires_track_block: true,
          crew_ids: ['CREW-TRD-01']
        },
        {
          job_id: 'JOB-SNT-01',
          section_id: 'SEC-A12',
          department: 'SIGNAL_TELECOM',
          duration_minutes: 60,
          priority_score: 79.0,
          requires_track_block: true,
          crew_ids: ['CREW-SNT-01']
        }
      ],
      crews: [
        { crew_id: 'CREW-ENG-01', department: 'ENGINEERING', active: true },
        { crew_id: 'CREW-TRD-01', department: 'TRACTION_DISTRIBUTION', active: true },
        { crew_id: 'CREW-SNT-01', department: 'SIGNAL_TELECOM', active: true }
      ],
      train_movements: [
        { section_id: 'SEC-A12', entry_time: '10:00', exit_time: '10:20' },
        { section_id: 'SEC-A12', entry_time: '10:45', exit_time: '11:05' },
        { section_id: 'SEC-A12', entry_time: '11:40', exit_time: '12:00' }
      ],
      freight_forecasts: [
        { section_id: 'SEC-A12', expected_entry_time: '15:00', expected_exit_time: '15:20' }
      ],
      corridor_restrictions: []
    };

    const optimizerUrl = process.env.OPTIMIZER_URL || 'http://127.0.0.1:8000';
    const optRes = await fetch(`${optimizerUrl}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(demoSnapshot)
    });
    const demoPlan = await optRes.json();

    if (demoPlan.blocks.length === 1 && demoPlan.blocks[0].jobs.length === 3) {
      const b = demoPlan.blocks[0];
      console.log(`[PASS] Verified 3 multi-department jobs consolidated into 1 block ${b.block_code}:`);
      console.log(`       Section: ${b.section_id}, Window: ${b.start_time} - ${b.end_time}`);
      console.log(`       Jobs in block:`);
      for (const j of b.jobs) {
        console.log(`         - ${j.job_id} (${j.start_time} to ${j.end_time})`);
      }
      console.log(`       Total Maintenance Minutes: ${demoPlan.metrics.total_maintenance_minutes}m`);
      console.log(`       Total Corridor Block Time: ${demoPlan.metrics.total_block_minutes}m`);
      console.log(`       Block Savings: ${demoPlan.metrics.block_savings_minutes}m saved!`);
    } else {
      throw new Error(`Demo scenario consolidation failed: blocks count = ${demoPlan.blocks.length}`);
    }

    console.log('\n===========================================================');
    console.log(' ALL PLANNING VERIFICATION TESTS PASSED SUCCESSFULLY! (6/6)');
    console.log('===========================================================');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPlanningTests()
    .then(() => {
      // Allow clean exit
    })
    .catch((err) => {
      console.error('\n[TEST SUITE FAILURE]:', err);
      process.exit(1);
    });
}
