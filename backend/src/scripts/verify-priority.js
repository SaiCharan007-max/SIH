import { fileURLToPath } from 'url';
import app from '../app.js';
import { scoreJob, rankJobs, compareScoredJobs } from '../services/priority/priorityModel.js';
import { getPriorityConfig } from '../config/priorityConfig.js';
import pool from '../config/db.js';

const TEST_PORT = 5096;
const BASE_URL = `http://localhost:${TEST_PORT}/api/maintenance/priorities`;

export const startTestServer = () => {
  return new Promise((resolve) => {
    const server = app.listen(TEST_PORT, () => {
      resolve(server);
    });
  });
};

export const runPriorityTests = async () => {
  console.log('===========================================================');
  console.log(' SIH26027 Maintenance Priority Engine Verification Suite');
  console.log('===========================================================');

  const refDate = new Date('2026-09-10T00:00:00.000Z');
  const baseJob = {
    id: 'test-job-base',
    job_code: 'JOB-BASE',
    criticality: 5,
    urgency: 5,
    overdue_days: 0,
    deadline: '2026-09-20T00:00:00.000Z',
    asset_status: 'ACTIVE',
    department: 'ENGINEERING',
    status: 'PENDING'
  };

  // Test 1: High criticality job gets higher score than low criticality job
  console.log('\n[TEST 1] High criticality vs low criticality...');
  const lowCrit = scoreJob({ ...baseJob, criticality: 2 }, refDate);
  const highCrit = scoreJob({ ...baseJob, criticality: 9 }, refDate);
  if (highCrit.priority_score > lowCrit.priority_score && highCrit.breakdown.criticality === 0.9 && lowCrit.breakdown.criticality === 0.2) {
    console.log(`[PASS] Criticality 9 (score: ${highCrit.priority_score}) > Criticality 2 (score: ${lowCrit.priority_score}).`);
  } else {
    throw new Error(`Criticality test failed: low=${lowCrit.priority_score}, high=${highCrit.priority_score}`);
  }

  // Test 2: High urgency increases priority
  console.log('\n[TEST 2] Urgency effect on priority...');
  const lowUrg = scoreJob({ ...baseJob, urgency: 3 }, refDate);
  const highUrg = scoreJob({ ...baseJob, urgency: 8 }, refDate);
  if (highUrg.priority_score > lowUrg.priority_score && highUrg.breakdown.urgency === 0.8 && lowUrg.breakdown.urgency === 0.3) {
    console.log(`[PASS] Urgency 8 (score: ${highUrg.priority_score}) > Urgency 3 (score: ${lowUrg.priority_score}).`);
  } else {
    throw new Error(`Urgency test failed: low=${lowUrg.priority_score}, high=${highUrg.priority_score}`);
  }

  // Test 3: Overdue jobs receive higher priority
  console.log('\n[TEST 3] Overdue days increase priority...');
  const notOverdue = scoreJob({ ...baseJob, overdue_days: 0 }, refDate);
  const overdue10 = scoreJob({ ...baseJob, overdue_days: 10 }, refDate);
  if (overdue10.priority_score > notOverdue.priority_score && overdue10.breakdown.overdue > notOverdue.breakdown.overdue) {
    console.log(`[PASS] Overdue 10 days (score: ${overdue10.priority_score}) > Overdue 0 (score: ${notOverdue.priority_score}).`);
  } else {
    throw new Error(`Overdue test failed: 0 days=${notOverdue.priority_score}, 10 days=${overdue10.priority_score}`);
  }

  // Test 4: Closer deadlines increase priority
  console.log('\n[TEST 4] Closer deadlines increase priority...');
  const farDeadline = scoreJob({ ...baseJob, deadline: '2026-09-30T00:00:00.000Z' }, refDate); // 20 days away
  const nearDeadline = scoreJob({ ...baseJob, deadline: '2026-09-11T00:00:00.000Z' }, refDate); // 1 day away
  if (nearDeadline.priority_score > farDeadline.priority_score && nearDeadline.breakdown.deadline_proximity > farDeadline.breakdown.deadline_proximity) {
    console.log(`[PASS] 1-day deadline (score: ${nearDeadline.priority_score}, prox: ${nearDeadline.breakdown.deadline_proximity}) > 20-day deadline (score: ${farDeadline.priority_score}, prox: ${farDeadline.breakdown.deadline_proximity}).`);
  } else {
    throw new Error(`Deadline proximity test failed: near=${nearDeadline.priority_score}, far=${farDeadline.priority_score}`);
  }

  // Test 5: OUT_OF_SERVICE asset increases priority
  console.log('\n[TEST 5] Asset OUT_OF_SERVICE increases priority...');
  const activeAsset = scoreJob({ ...baseJob, asset_status: 'ACTIVE' }, refDate);
  const oosAsset = scoreJob({ ...baseJob, asset_status: 'OUT_OF_SERVICE' }, refDate);
  if (oosAsset.priority_score > activeAsset.priority_score && oosAsset.breakdown.asset_status === 1.0 && activeAsset.breakdown.asset_status === 0.2) {
    console.log(`[PASS] OUT_OF_SERVICE asset (score: ${oosAsset.priority_score}) > ACTIVE asset (score: ${activeAsset.priority_score}).`);
  } else {
    throw new Error(`Asset status test failed: active=${activeAsset.priority_score}, oos=${oosAsset.priority_score}`);
  }

  // Test 6: Missing deadline does not crash the scorer and yields non-negative score
  console.log('\n[TEST 6] Missing deadline robustness...');
  const nullDeadlineJob = scoreJob({ ...baseJob, deadline: null }, refDate);
  if (nullDeadlineJob.priority_score >= 0 && nullDeadlineJob.breakdown.deadline_proximity === 0.20) {
    console.log(`[PASS] Null deadline handled safely (score: ${nullDeadlineJob.priority_score}, prox: ${nullDeadlineJob.breakdown.deadline_proximity}).`);
  } else {
    throw new Error(`Null deadline test failed: ${JSON.stringify(nullDeadlineJob)}`);
  }

  // Test 7: 30+ overdue days saturates the overdue component
  console.log('\n[TEST 7] Overdue saturation threshold (30 days)...');
  const overdue30 = scoreJob({ ...baseJob, overdue_days: 30 }, refDate);
  const overdue60 = scoreJob({ ...baseJob, overdue_days: 60 }, refDate);
  if (overdue30.breakdown.overdue === 1.0 && overdue60.breakdown.overdue === 1.0 && overdue30.priority_score === overdue60.priority_score) {
    console.log(`[PASS] Both 30 and 60 overdue days saturated at 1.00 (score: ${overdue30.priority_score}).`);
  } else {
    throw new Error(`Overdue saturation test failed: 30d=${overdue30.breakdown.overdue}, 60d=${overdue60.breakdown.overdue}`);
  }

  // Test 8: Score always remains between 0 and 100
  console.log('\n[TEST 8] Score bounds (0.0 to 100.0)...');
  const minJob = scoreJob({ criticality: 1, urgency: 1, overdue_days: 0, deadline: '2099-01-01', asset_status: 'ACTIVE' }, refDate);
  const maxJob = scoreJob({ criticality: 10, urgency: 10, overdue_days: 50, deadline: '2020-01-01', asset_status: 'OUT_OF_SERVICE' }, refDate);
  if (minJob.priority_score >= 0 && maxJob.priority_score <= 100 && maxJob.priority_score >= minJob.priority_score) {
    console.log(`[PASS] Minimum score = ${minJob.priority_score} (>=0), Maximum score = ${maxJob.priority_score} (<=100).`);
  } else {
    throw new Error(`Score bounds test failed: min=${minJob.priority_score}, max=${maxJob.priority_score}`);
  }

  // Test 9: Ranking is strictly descending
  console.log('\n[TEST 9] Ranking sorts descending by priority_score...');
  const testList = [
    { ...baseJob, id: '1', job_code: 'J-1', criticality: 4 },
    { ...baseJob, id: '2', job_code: 'J-2', criticality: 9 },
    { ...baseJob, id: '3', job_code: 'J-3', criticality: 7 }
  ];
  const rankedList = rankJobs(testList, refDate);
  const scores = rankedList.map((j) => j.priority_score);
  const isDescending = scores.every((val, idx, arr) => idx === 0 || arr[idx - 1] >= val);
  if (isDescending && rankedList[0].job_code === 'J-2' && rankedList[1].job_code === 'J-3' && rankedList[2].job_code === 'J-1') {
    console.log(`[PASS] Ranked order: ${rankedList.map((j) => `${j.job_code}(${j.priority_score})`).join(' -> ')}`);
  } else {
    throw new Error(`Ranking descending test failed: ${JSON.stringify(scores)}`);
  }

  // Test 10: Tie-breaking is deterministic
  console.log('\n[TEST 10] Deterministic tie-breaking...');
  // Two jobs with same calculated score but different criticality
  const tiedA = { priority_score: 75.0, breakdown: { criticality: 0.8, urgency: 0.7 }, deadline: '2026-09-15', job_code: 'JOB-A' };
  const tiedB = { priority_score: 75.0, breakdown: { criticality: 0.9, urgency: 0.6 }, deadline: '2026-09-15', job_code: 'JOB-B' };
  const cmpCrit = compareScoredJobs(tiedA, tiedB); // higher criticality (tiedB) should come first
  if (cmpCrit > 0) {
    console.log('[PASS] Tie-break resolved by criticality: JOB-B (0.9) preferred over JOB-A (0.8).');
  } else {
    throw new Error('Tie-break by criticality failed');
  }

  // Test 11: Idempotency (same job + same reference date -> identical result)
  console.log('\n[TEST 11] Idempotency & determinism...');
  const runA = scoreJob(baseJob, refDate);
  const runB = scoreJob(baseJob, refDate);
  if (JSON.stringify(runA) === JSON.stringify(runB)) {
    console.log(`[PASS] Identical evaluation verified (score: ${runA.priority_score}).`);
  } else {
    throw new Error('Idempotency check failed: evaluations diverged');
  }

  // Test 12: Reference date sensitivity
  console.log('\n[TEST 12] Reference date sensitivity on deadline proximity...');
  const pastRef = new Date('2026-09-01T00:00:00.000Z'); // deadline 2026-09-20 is 19 days away (>14 days -> 0.05)
  const nearRef = new Date('2026-09-19T00:00:00.000Z'); // deadline 2026-09-20 is 1 day away (~0.93)
  const scorePastRef = scoreJob(baseJob, pastRef);
  const scoreNearRef = scoreJob(baseJob, nearRef);
  if (scoreNearRef.priority_score > scorePastRef.priority_score) {
    console.log(`[PASS] Proximity reflects reference date: nearRef score (${scoreNearRef.priority_score}) > pastRef score (${scorePastRef.priority_score}).`);
  } else {
    throw new Error(`Reference date sensitivity test failed: past=${scorePastRef.priority_score}, near=${scoreNearRef.priority_score}`);
  }

  // Test 13: Manual Test Scenario from Specification
  // JOB A: crit=10, urg=9, overdue=10, deadline=near (2 days), asset=OUT_OF_SERVICE
  // JOB B: crit=6, urg=5, overdue=0, deadline=far (25 days), asset=ACTIVE
  // JOB C: crit=9, urg=8, overdue=2, deadline=moderately near (7 days), asset=ACTIVE
  // Expected ranking: A > C > B
  console.log('\n[TEST 13] Manual Test Scenario Verification (A > C > B)...');
  const scenarioJobs = [
    {
      id: 'job-b',
      job_code: 'JOB-B',
      criticality: 6,
      urgency: 5,
      overdue_days: 0,
      deadline: '2026-10-05T00:00:00.000Z',
      asset_status: 'ACTIVE'
    },
    {
      id: 'job-a',
      job_code: 'JOB-A',
      criticality: 10,
      urgency: 9,
      overdue_days: 10,
      deadline: '2026-09-12T00:00:00.000Z',
      asset_status: 'OUT_OF_SERVICE'
    },
    {
      id: 'job-c',
      job_code: 'JOB-C',
      criticality: 9,
      urgency: 8,
      overdue_days: 2,
      deadline: '2026-09-17T00:00:00.000Z',
      asset_status: 'ACTIVE'
    }
  ];
  const scenarioRanked = rankJobs(scenarioJobs, refDate);
  const rankCodes = scenarioRanked.map((j) => `${j.job_code} (${j.priority_score}, ${j.priority_level})`);
  console.log(`[INFO] Scenario Ranked Result:\n       1. ${rankCodes[0]}\n       2. ${rankCodes[1]}\n       3. ${rankCodes[2]}`);

  if (scenarioRanked[0].job_code === 'JOB-A' && scenarioRanked[1].job_code === 'JOB-C' && scenarioRanked[2].job_code === 'JOB-B') {
    console.log('[PASS] Manual scenario confirmed: JOB-A > JOB-C > JOB-B.');
  } else {
    throw new Error(`Scenario ranking failed: expected A > C > B, got ${scenarioRanked.map((j) => j.job_code).join(' > ')}`);
  }

  // Test 14: End-to-End HTTP API Endpoint (GET /api/maintenance/priorities)
  console.log('\n[TEST 14] HTTP API Endpoint (GET /api/maintenance/priorities)...');
  const server = await startTestServer();
  try {
    const apiRes = await fetch(`${BASE_URL}?reference_date=2026-09-10`);
    const apiData = await apiRes.json();
    if (apiRes.status === 200 && apiData.success && Array.isArray(apiData.data.jobs) && apiData.data.jobs.length > 0) {
      console.log(`[PASS] Retrieved ${apiData.data.jobs.length} ranked jobs from API.`);
      const topJob = apiData.data.jobs[0];
      console.log(`       Top Ranked: ${topJob.job_code} (Score: ${topJob.priority_score}, Level: ${topJob.priority_level})`);
      console.log(`       Breakdown: crit=${topJob.breakdown.criticality}, urg=${topJob.breakdown.urgency}, overdue=${topJob.breakdown.overdue}, dl=${topJob.breakdown.deadline_proximity}, asset=${topJob.breakdown.asset_status}`);
    } else {
      throw new Error(`API test failed: ${JSON.stringify(apiData)}`);
    }

    // Filter test by department
    const deptRes = await fetch(`${BASE_URL}?department=ENGINEERING&reference_date=2026-09-10`);
    const deptData = await deptRes.json();
    const allEng = deptData.data.jobs.every((j) => j.department === 'ENGINEERING');
    if (deptRes.status === 200 && deptData.success && allEng && deptData.data.jobs.length > 0) {
      console.log(`[PASS] Department filter returned ${deptData.data.jobs.length} jobs, all ENGINEERING.`);
    } else {
      throw new Error(`Department filter test failed: ${JSON.stringify(deptData)}`);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }

  console.log('\n===========================================================');
  console.log(' [SUCCESS] ALL 14 PRIORITY ENGINE CHECKS PASSED!');
  console.log('===========================================================');
};

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPriorityTests()
    .then(() => {
      // Clean exit
    })
    .catch((err) => {
      console.error('\n[FAIL] Priority Engine verification failed:', err);
      process.exit(1);
    });
}

