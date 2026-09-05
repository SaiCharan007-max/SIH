"""
Core CP-SAT solver implementation and block consolidation logic.
"""

from ortools.sat.python import cp_model
from typing import Dict, Any, List, Tuple
from time_utils import time_to_minutes, minutes_to_time, intervals_overlap
from models import (
    PlanningSnapshot,
    OptimizedPlanOutput,
    MaintenanceBlockOutput,
    ScheduledBlockJob,
    UnscheduledJobOutput,
    OptimizationMetrics
)
from constraints import (
    add_window_constraints,
    add_operational_conflict_constraints,
    add_crew_constraints,
    add_resource_constraints,
    add_frozen_job_constraints
)
from objective import apply_objective, DEFAULT_WEIGHTS

def consolidate_jobs_into_blocks(
    scheduled_jobs: List[Dict[str, Any]],
    section_id: str
) -> List[Dict[str, Any]]:
    """
    Consolidates scheduled jobs on the same section into unified maintenance blocks.
    Jobs belong to the same block when their scheduled intervals overlap or touch (contiguous).
    Block start = min(job start)
    Block end = max(job end)
    """
    if not scheduled_jobs:
        return []

    # Sort jobs by start time, then by end time
    sorted_jobs = sorted(scheduled_jobs, key=lambda j: (j["start_minutes"], j["end_minutes"]))

    blocks = []
    current_block_jobs = [sorted_jobs[0]]
    current_block_start = sorted_jobs[0]["start_minutes"]
    current_block_end = sorted_jobs[0]["end_minutes"]

    for job in sorted_jobs[1:]:
        j_start = job["start_minutes"]
        j_end = job["end_minutes"]

        # Check if job overlaps or touches the current block
        # Overlap or contiguous: j_start <= current_block_end
        if j_start <= current_block_end:
            current_block_jobs.append(job)
            current_block_end = max(current_block_end, j_end)
        else:
            # Finalize current block and start a new one
            blocks.append({
                "section_id": section_id,
                "start_minutes": current_block_start,
                "end_minutes": current_block_end,
                "jobs": current_block_jobs
            })
            current_block_jobs = [job]
            current_block_start = j_start
            current_block_end = j_end

    # Append the last block
    if current_block_jobs:
        blocks.append({
            "section_id": section_id,
            "start_minutes": current_block_start,
            "end_minutes": current_block_end,
            "jobs": current_block_jobs
        })

    return blocks

def diagnose_unscheduled_reason(job: Any, snapshot: PlanningSnapshot) -> str:
    """
    Diagnoses the most specific reason why a job could not be scheduled.
    """
    # 1. Check planning window feasibility
    win_start = time_to_minutes(snapshot.planning_window.start)
    win_end = time_to_minutes(snapshot.planning_window.end)
    if job.duration_minutes > (win_end - win_start):
        return "OUTSIDE_PLANNING_WINDOW"

    # 2. Check crew availability
    active_crews = {c.crew_id: c for c in snapshot.crews if c.active}
    if job.crew_ids:
        if not any(cid in active_crews for cid in job.crew_ids):
            return "NO_ASSIGNED_CREW"
    else:
        dept_crews = [c for c in active_crews.values() if c.department == job.department]
        if not dept_crews:
            return "NO_ASSIGNED_CREW"

    # Default robust explanation
    return "NO_FEASIBLE_WINDOW"

def solve_planning_snapshot(snapshot: PlanningSnapshot) -> OptimizedPlanOutput:
    """
    Solves the daily maintenance planning problem using OR-Tools CP-SAT.
    """
    model = cp_model.CpModel()

    win_start_min = time_to_minutes(snapshot.planning_window.start)
    win_end_min = time_to_minutes(snapshot.planning_window.end)

    frozen_durations: Dict[str, int] = {}
    if snapshot.mode == "REPLAN" and snapshot.frozen_jobs:
        for fj in snapshot.frozen_jobs:
            dur = time_to_minutes(fj.end_time) - time_to_minutes(fj.start_time)
            if dur > 0:
                frozen_durations[fj.job_id] = dur

    # 1. Create variables for each job
    job_vars: Dict[str, Any] = {}
    for job in snapshot.jobs:
        j_id = job.job_id
        duration = frozen_durations.get(j_id, job.duration_minutes)
        is_scheduled = model.NewBoolVar(f"{j_id}_is_scheduled")
        start = model.NewIntVar(win_start_min, win_end_min, f"{j_id}_start")
        end = model.NewIntVar(win_start_min, win_end_min, f"{j_id}_end")
        interval = model.NewOptionalIntervalVar(
            start, duration, end, is_scheduled, f"{j_id}_interval"
        )
        job_vars[j_id] = {
            "is_scheduled": is_scheduled,
            "start": start,
            "end": end,
            "interval": interval
        }

    # 2. Apply constraints
    add_window_constraints(model, job_vars, snapshot.jobs, win_start_min, win_end_min)
    add_operational_conflict_constraints(model, job_vars, snapshot)
    add_crew_constraints(model, job_vars, snapshot)
    add_resource_constraints(model, job_vars, snapshot)
    add_frozen_job_constraints(model, job_vars, snapshot)

    # 3. Apply objective
    apply_objective(model, job_vars, snapshot.jobs, DEFAULT_WEIGHTS, snapshot=snapshot)

    # 4. Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15.0
    solver.parameters.num_search_workers = 4

    status = solver.Solve(model)

    status_name = solver.StatusName(status)

    # 5. Extract results
    scheduled_by_section: Dict[str, List[Dict[str, Any]]] = {}
    unscheduled_list: List[UnscheduledJobOutput] = []

    scheduled_priority_value = 0.0
    total_maintenance_minutes = 0
    deadline_met_count = 0
    deadline_missed_count = 0

    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        for job in snapshot.jobs:
            j_id = job.job_id
            is_sched = solver.Value(job_vars[j_id]["is_scheduled"]) == 1

            if is_sched:
                j_start_min = solver.Value(job_vars[j_id]["start"])
                j_end_min = solver.Value(job_vars[j_id]["end"])

                # Determine assigned crew
                assigned_crew = None
                if "assigned_crew_var" in job_vars[j_id] and job_vars[j_id]["assigned_crew_var"]:
                    assigned_crew = job_vars[j_id]["assigned_crew_var"]
                elif "crew_choice_vars" in job_vars[j_id]:
                    for cid, c_var in job_vars[j_id]["crew_choice_vars"].items():
                        if solver.Value(c_var) == 1:
                            assigned_crew = cid
                            break

                # Check deadline
                deadline_met = True
                if job.deadline:
                    # In single-day planning, compare with job.deadline or plan_date
                    # For prototype: if deadline is before plan_date, deadline missed
                    # For same date with no specific time, deadline_met is True
                    pass

                if deadline_met:
                    deadline_met_count += 1
                else:
                    deadline_missed_count += 1

                scheduled_priority_value += job.priority_score
                total_maintenance_minutes += (j_end_min - j_start_min)

                item = {
                    "job_id": j_id,
                    "section_id": job.section_id,
                    "start_minutes": j_start_min,
                    "end_minutes": j_end_min,
                    "start_time": minutes_to_time(j_start_min),
                    "end_time": minutes_to_time(j_end_min),
                    "assigned_crew_id": assigned_crew,
                    "deadline_met": deadline_met
                }
                scheduled_by_section.setdefault(job.section_id, []).append(item)
            else:
                reason = diagnose_unscheduled_reason(job, snapshot)
                unscheduled_list.append(UnscheduledJobOutput(job_id=j_id, reason=reason))
    else:
        # No solution found or completely infeasible
        for job in snapshot.jobs:
            reason = diagnose_unscheduled_reason(job, snapshot)
            unscheduled_list.append(UnscheduledJobOutput(job_id=job.job_id, reason=reason))

    # 6. Consolidate scheduled jobs into maintenance blocks
    blocks_output: List[MaintenanceBlockOutput] = []
    total_block_minutes = 0
    block_seq = 1

    for section_id, s_jobs in scheduled_by_section.items():
        raw_blocks = consolidate_jobs_into_blocks(s_jobs, section_id)
        for rb in raw_blocks:
            b_code = f"BLK-{block_seq:03d}"
            block_seq += 1
            b_start_min = rb["start_minutes"]
            b_end_min = rb["end_minutes"]
            b_dur = b_end_min - b_start_min
            total_block_minutes += b_dur

            block_jobs = []
            for j in rb["jobs"]:
                old_start = None
                old_end = None
                moved = False
                if snapshot.previous_schedule and j["job_id"] in snapshot.previous_schedule:
                    prev = snapshot.previous_schedule[j["job_id"]]
                    old_start = prev.start_time
                    old_end = prev.end_time
                    moved = (old_start != j["start_time"] or old_end != j["end_time"])

                block_jobs.append(ScheduledBlockJob(
                    job_id=j["job_id"],
                    start_time=j["start_time"],
                    end_time=j["end_time"],
                    assigned_crew_id=j.get("assigned_crew_id"),
                    deadline_met=j.get("deadline_met", True),
                    old_start=old_start,
                    old_end=old_end,
                    moved=moved
                ))

            blocks_output.append(MaintenanceBlockOutput(
                block_code=b_code,
                section_id=section_id,
                start_time=minutes_to_time(b_start_min),
                end_time=minutes_to_time(b_end_min),
                jobs=block_jobs
            ))

    # 7. Compute Metrics
    jobs_considered = len(snapshot.jobs)
    jobs_scheduled = jobs_considered - len(unscheduled_list)
    block_savings_minutes = max(0, total_maintenance_minutes - total_block_minutes)

    metrics = OptimizationMetrics(
        jobs_considered=jobs_considered,
        jobs_scheduled=jobs_scheduled,
        jobs_unscheduled=len(unscheduled_list),
        scheduled_priority_value=round(scheduled_priority_value, 2),
        total_maintenance_minutes=total_maintenance_minutes,
        total_block_minutes=total_block_minutes,
        block_savings_minutes=block_savings_minutes,
        deadline_met_count=deadline_met_count,
        deadline_missed_count=deadline_missed_count
    )

    return OptimizedPlanOutput(
        plan_date=snapshot.plan_date,
        status="PROPOSED",
        blocks=blocks_output,
        unscheduled_jobs=unscheduled_list,
        metrics=metrics,
        solver_status=status_name
    )
