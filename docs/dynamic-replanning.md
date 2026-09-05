# Dynamic Replanning & Disruption Recovery

> **Core Principle:**
> *"Dynamic replanning modifies only the portion of the schedule affected by a disruption while preserving unaffected planned work whenever feasible."*

> **Safety & Decision-Support Notice:**
> *"The prototype is a decision-support system and does not autonomously authorize railway operations."* All dynamically generated plans maintain status `PROPOSED` until reviewed, verified, and authorized through appropriate railway operational workflows.

---

## 1. Why Static Schedules Are Insufficient

In real-world railway operations across Indian Railways (IR), operating conditions are dynamic and subject to perturbations:
- Track maintenance operations may encounter unpredicted track conditions (e.g., rusted fastenings, ballast fouling, welding temperature issues) causing **maintenance overruns**.
- Passenger or freight trains may experience delays upstream, shifting their occupancy windows across planned maintenance sections.
- Unscheduled train movements may be cancelled or diverted, leaving previously unavailable corridor slots open for maintenance.
- Urgent emergency maintenance (e.g., rail fracture, OHE dropper detachment, point detection failure) may emerge unexpectedly.
- Assigned maintenance crews or shared machinery (e.g., tampers, tower wagons) may experience unexpected unavailability.
- Dynamic corridor speed or availability restrictions may be imposed by civil engineering or operating controls.

A static planning system that cannot respond to real-time events quickly becomes obsolete upon the first disruption. Blindly recomputing an entire 24-hour network schedule from scratch ("cold restart") causes massive schedule instability: previously committed crews, passenger train allowances, and unaffected department blocks get unnecessarily shuffled, causing operational chaos across divisions.

**Dynamic incremental replanning** resolves this by isolating disruptions to their causal radius, freezing unaffected scheduled work, and re-optimizing only the impacted jobs and blocks.

---

## 2. Triggering Disruption Events

The system introduces an auditable event ledger in PostgreSQL (`planning_events`) supporting six primary disruption categories:

| Event Type | Operational Context | Impact |
| :--- | :--- | :--- |
| `MAINTENANCE_OVERRUN` | A maintenance job takes longer than planned (e.g. welding delay pushes end from 14:00 to 15:00). | Affects track possession, delays downstream jobs on the section, and extends crew/resource commitments. |
| `TRAIN_DELAY` | A train's entry/exit time shifts into an existing planned block interval. | Creates operational conflict with overlapping maintenance blocks; triggers rescheduling of affected maintenance. |
| `TRAIN_CANCELLATION` | A scheduled train movement is cancelled or diverted away from a section. | Frees up track capacity; unscheduled maintenance jobs can be fitted into the newly opened gap. |
| `EMERGENCY_MAINTENANCE` | Urgent unscheduled work (criticality/urgency 10) arrives. | Evaluated by Priority Engine; slotted into the plan with minimal disruption to scheduled work. |
| `CREW_UNAVAILABLE` | An assigned crew goes off-duty or is redeployed. | Affects jobs assigned to that crew; reassigns to compatible available crew or marks job unscheduled. |
| `CORRIDOR_RESTRICTION_CHANGE`| Operating department imposes temporary speed or possession restriction. | Maintenance blocks overlapping the restricted interval are identified and rescheduled. |

---

## 3. Impact Analysis (`planningImpact.service.js`)

When an event occurs, the system does not trigger a global schedule wipe. Instead, `analyzeEventImpact()` computes the causal disturbance cone:

```
DISRUPTION EVENT
       │
       ▼
┌────────────────────────────────────────────────────────┐
│               Impact Analysis Engine                   │
│                                                        │
│  1. Identify primary entity (Job, Section, Train, Crew)│
│  2. Compute affected time window [start, end]          │
│  3. Detect section overlaps within time window         │
│  4. Detect shared-crew & resource dependencies         │
│  5. Propagate impact to consolidated block boundaries   │
└────────────────────────────────────────────────────────┘
       │
       ├───────────────────────────────┐
       ▼                               ▼
[Replannable Jobs Set]        [Frozen Jobs Set]
(Subject to re-optimization)  (Strictly fixed start/end)
```

The output contains:
- `affected_sections`: Sections where maintenance or trains are directly impacted.
- `affected_blocks`: Maintenance blocks containing at least one affected job.
- `affected_jobs`: Jobs that must be rescheduled or adjusted.
- `frozen_jobs`: Jobs confirmed to be completely independent of the disruption.
- `affected_time_window`: The temporal bounds `[start, end]` encompassing the disruption.

---

## 4. Frozen vs. Replannable Jobs

To maintain schedule stability:
- **Frozen Jobs**:
  - Must remain strictly invariant: `new_start == old_start` and `new_end == old_end`.
  - Must not be dropped by the optimizer (`is_scheduled == 1`).
  - Completed maintenance work and jobs outside the affected time/resource window are always frozen.
- **Replannable Jobs**:
  - Include the directly disrupted job, jobs sharing the occupied track section during the overrun/delay, and jobs sharing crews/equipment that are held up.
  - OR-Tools CP-SAT is given freedom to shift their start and end times within feasible corridor windows.
  - If a job was previously scheduled, its previous start time is supplied to the solver to penalize gratuitous shifts.

---

## 5. Incremental Optimization (OR-Tools CP-SAT Extension)

Rather than creating a separate solver, the existing Google OR-Tools CP-SAT engine is extended with mode awareness:

### Request Modes:
- `mode = "INITIAL"`: Full daily schedule generation from scratch.
- `mode = "REPLAN"`: Incremental re-optimization preserving frozen jobs.

### Formulation Enhancements:
1. **Frozen Interval Constraints (`add_frozen_job_constraints`)**:
   ```python
   model.Add(job_vars[j_id]["is_scheduled"] == 1)
   model.Add(job_vars[j_id]["start"] == fixed_start_min)
   model.Add(job_vars[j_id]["end"] == fixed_end_min)
   ```
2. **Schedule Preservation Penalty in Objective Function**:
   ```python
   # Penalize moving a previously scheduled job:
   moved_delta = model.NewIntVar(0, win_end_min, f"{j_id}_moved_delta")
   model.AddAbsEquality(moved_delta, job_vars[j_id]["start"] - prev_start_min)
   objective_terms.append(-MOVED_JOB_PENALTY * moved_delta)
   ```
   This penalty ensures the solver prefers keeping previously scheduled times whenever mathematically feasible, moving jobs only when hard operational constraints (train passages, crew clashes, section restrictions) force a shift.

---

## 6. Lightweight Plan Versioning (`planning_runs`)

The system never overwrites historical plans. Every plan generation or replan produces an auditable `planning_runs` record:

```
[RUN-001] run_type = INITIAL, status = PROPOSED
    │
    ▼ (Event: MAINTENANCE_OVERRUN on JOB-ENG-001)
[RUN-002] run_type = REPLAN, parent_run_id = RUN-001, status = PROPOSED
    │     (RUN-001 status transitions to SUPERSEDED)
    │
    ▼ (Event: TRAIN_DELAY on TRN-12002)
[RUN-003] run_type = REPLAN, parent_run_id = RUN-002, status = PROPOSED
          (RUN-002 status transitions to SUPERSEDED)
```

- Each block in `maintenance_blocks` belongs to a specific `planning_run_id`.
- Historical runs remain permanently queryable via `GET /api/planning/runs/:id`.

---

## 7. Plan Comparison (`planningComparison.service.js`)

The comparison engine computes diffs between any two planning runs (typically parent and child):

```json
{
  "old_run_id": "RUN-001",
  "new_run_id": "RUN-002",
  "summary": {
    "jobs_unchanged": 13,
    "jobs_moved": 1,
    "jobs_newly_scheduled": 0,
    "jobs_unscheduled": 0,
    "blocks_unchanged": 4,
    "blocks_changed": 2
  },
  "changes": [
    {
      "job_id": "926f6f6c-0112-42cb-99f3-caa57a7ea243",
      "job_code": "JOB-ENG-003",
      "change": "MOVED",
      "old_start": "08:00:00",
      "old_end": "11:00:00",
      "new_start": "12:00:00",
      "new_end": "15:00:00"
    }
  ]
}
```

This diff powers future Section Controller decision displays, highlighting exactly what shifted and why.

---

## 8. Transactional Persistence

Dynamic replanning persistence operates under an atomic PostgreSQL transaction:

```
BEGIN TRANSACTION;
  1. Insert disruption event into planning_events (status = 'RECEIVED')
  2. Insert new planning run into planning_runs (status = 'PROPOSED')
  3. Insert revised maintenance_blocks linked to new planning_run_id
  4. Insert maintenance_block_jobs relationships
  5. Validate complete plan against operational constraints
  6. Transition parent planning_runs to status = 'SUPERSEDED'
  7. Transition planning_events to status = 'PROPOSED'
COMMIT;
```

If validation fails or the optimizer errors:
- The entire transaction is **rolled back**.
- The parent run remains active and untouched in `PROPOSED` status.
- A failure log run is recorded without corrupting active schedule data.

---

## 9. Prototype Limitations & Future Enhancements

1. **Deterministic Turnaround Times**: The current model assumes standard travel and setup buffers for crews moving between sections.
2. **Single-Day Time Horizon**: Dynamic replanning operates within a 24-hour single-day planning window. Multi-day propagation across midnight horizons is deferred to future chunks.
3. **External Systems Integration**: The prototype simulates Indian Railways Control Office Application (COA) and FOIS train feeds via REST API endpoints rather than direct enterprise message buses.
4. **Human Authorization**: All outputs require validation by authorized Section Controllers; autonomous command issuance to signalling or train operation interlocking is strictly excluded.
