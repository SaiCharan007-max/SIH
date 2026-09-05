"""
Hard and operational constraints for the CP-SAT Maintenance Block Optimizer.

Prototype Assumptions Note:
- Freight forecast intervals are treated as blocked operational windows in the prototype.
  Production deployment should use authoritative operating-control data and configurable uncertainty handling.
- Corridor restrictions marked UNAVAILABLE or RESTRICTED are treated as unavailable for track-block maintenance.
- Prototype compatibility rules allow concurrent maintenance across different departments on the same section
  if distinct crews and non-conflicting resources are used.
"""

from ortools.sat.python import cp_model
from typing import Dict, Any, List
from time_utils import time_to_minutes
from models import PlanningSnapshot, JobInput

def add_window_constraints(
    model: cp_model.CpModel,
    job_vars: Dict[str, Any],
    jobs: List[JobInput],
    window_start_min: int,
    window_end_min: int
):
    """
    Every scheduled job must strictly fit inside the planning window:
    window_start <= start and end <= window_end
    """
    for job in jobs:
        j_id = job.job_id
        # Duration is fixed
        model.Add(job_vars[j_id]["end"] == job_vars[j_id]["start"] + job.duration_minutes)

        # Inside planning window
        model.Add(job_vars[j_id]["start"] >= window_start_min)
        model.Add(job_vars[j_id]["end"] <= window_end_min)

def add_operational_conflict_constraints(
    model: cp_model.CpModel,
    job_vars: Dict[str, Any],
    snapshot: PlanningSnapshot
):
    """
    Prevents scheduled jobs requiring track blocks from overlapping:
    1. Train movements on the same section
    2. Freight forecast occupancies on the same section
    3. Corridor restrictions (UNAVAILABLE/RESTRICTED) on the same section
    """
    # Collect all blocked intervals per section
    blocked_intervals_by_section: Dict[str, List[tuple]] = {}

    # 1. Train movements
    for tm in snapshot.train_movements:
        s_id = tm.section_id
        s_min = time_to_minutes(tm.entry_time)
        e_min = time_to_minutes(tm.exit_time)
        blocked_intervals_by_section.setdefault(s_id, []).append((s_min, e_min, f"TRAIN_{tm.priority}"))

    # 2. Freight forecasts
    for ff in snapshot.freight_forecasts:
        s_id = ff.section_id
        s_min = time_to_minutes(ff.expected_entry_time)
        e_min = time_to_minutes(ff.expected_exit_time)
        blocked_intervals_by_section.setdefault(s_id, []).append((s_min, e_min, "FREIGHT_FORECAST"))

    # 3. Corridor restrictions
    for cr in snapshot.corridor_restrictions:
        if cr.status.upper() in ["UNAVAILABLE", "RESTRICTED"]:
            s_id = cr.section_id
            s_min = time_to_minutes(cr.start_time)
            e_min = time_to_minutes(cr.end_time)
            blocked_intervals_by_section.setdefault(s_id, []).append((s_min, e_min, f"CORRIDOR_{cr.status}"))

    # Add no-overlap constraints with blocked intervals
    for job in snapshot.jobs:
        if not job.requires_track_block:
            continue
        j_id = job.job_id
        blocked_list = blocked_intervals_by_section.get(job.section_id, [])
        is_sched = job_vars[j_id]["is_scheduled"]
        j_start = job_vars[j_id]["start"]
        j_end = job_vars[j_id]["end"]

        for b_start, b_end, _ in blocked_list:
            if b_end <= b_start:
                continue
            # Two intervals (j_start, j_end) and (b_start, b_end) overlap iff:
            # j_start < b_end AND j_end > b_start
            # If scheduled, we must NOT have an overlap:
            # (j_end <= b_start) OR (j_start >= b_end)
            before = model.NewBoolVar(f"{j_id}_before_{b_start}")
            after = model.NewBoolVar(f"{j_id}_after_{b_end}")

            model.Add(j_end <= b_start).OnlyEnforceIf(before)
            model.Add(j_start >= b_end).OnlyEnforceIf(after)
            # If scheduled, at least one must be true:
            model.AddBoolOr([before, after]).OnlyEnforceIf(is_sched)

def add_crew_constraints(
    model: cp_model.CpModel,
    job_vars: Dict[str, Any],
    snapshot: PlanningSnapshot
):
    """
    Crew constraints:
    1. A crew can only be assigned to one job at a time (no overlapping jobs for same crew).
    2. Jobs only use active crews from matching department (or explicit assignments).
    """
    crew_by_id = {c.crew_id: c for c in snapshot.crews}
    active_crew_ids = {c.crew_id for c in snapshot.crews if c.active}

    # Group job optional intervals by assigned crew
    # In this model, if job has crew_ids, we map them. If not specified, match active department crews.
    crew_job_intervals: Dict[str, List[Any]] = {}

    for job in snapshot.jobs:
        j_id = job.job_id
        # Determine eligible crews
        eligible_crews = []
        if job.crew_ids:
            eligible_crews = [cid for cid in job.crew_ids if cid in active_crew_ids]
        else:
            # Department matching
            eligible_crews = [
                c.crew_id for c in snapshot.crews
                if c.active and c.department == job.department
            ]

        job_vars[j_id]["eligible_crews"] = eligible_crews

        if not eligible_crews:
            # No eligible crew -> cannot be scheduled
            model.Add(job_vars[j_id]["is_scheduled"] == 0)
            job_vars[j_id]["assigned_crew_var"] = None
            continue

        if len(eligible_crews) == 1:
            assigned_c = eligible_crews[0]
            job_vars[j_id]["assigned_crew_var"] = assigned_c
            interval = job_vars[j_id]["interval"]
            crew_job_intervals.setdefault(assigned_c, []).append(interval)
        else:
            # Multiple eligible crews: create boolean choice variables
            crew_choices = {}
            for cid in eligible_crews:
                b_var = model.NewBoolVar(f"{j_id}_uses_{cid}")
                crew_choices[cid] = b_var
                # Create a specific optional interval for this crew choice
                c_opt_interval = model.NewOptionalIntervalVar(
                    job_vars[j_id]["start"],
                    job.duration_minutes,
                    job_vars[j_id]["end"],
                    b_var,
                    f"{j_id}_{cid}_interval"
                )
                crew_job_intervals.setdefault(cid, []).append(c_opt_interval)

            # If job is scheduled, exactly one crew must be chosen
            model.Add(sum(crew_choices.values()) == job_vars[j_id]["is_scheduled"])
            job_vars[j_id]["crew_choice_vars"] = crew_choices

    # Enforce NoOverlap for each crew
    for cid, intervals in crew_job_intervals.items():
        if len(intervals) > 1:
            model.AddNoOverlap(intervals)

def add_resource_constraints(
    model: cp_model.CpModel,
    job_vars: Dict[str, Any],
    snapshot: PlanningSnapshot
):
    """
    Shared resource constraints:
    Jobs requiring the same named resource cannot overlap if total demand > available quantity.
    In the prototype, shared resources default to capacity 1 unless specified.
    """
    resource_intervals: Dict[str, List[Any]] = {}

    for job in snapshot.jobs:
        j_id = job.job_id
        for res in job.resources:
            r_name = res.resource_name.strip().upper()
            resource_intervals.setdefault(r_name, []).append(job_vars[j_id]["interval"])

    for r_name, intervals in resource_intervals.items():
        if len(intervals) > 1:
            # Capacity 1 -> NoOverlap
            model.AddNoOverlap(intervals)

def add_frozen_job_constraints(
    model: cp_model.CpModel,
    job_vars: Dict[str, Any],
    snapshot: PlanningSnapshot
):
    """
    Enforces that frozen jobs in REPLAN mode cannot move:
    start == fixed_start, end == fixed_end, is_scheduled == 1.
    """
    if snapshot.mode != "REPLAN" or not snapshot.frozen_jobs:
        return

    for fj in snapshot.frozen_jobs:
        j_id = fj.job_id
        if j_id in job_vars:
            fixed_start_min = time_to_minutes(fj.start_time)
            fixed_end_min = time_to_minutes(fj.end_time)

            model.Add(job_vars[j_id]["is_scheduled"] == 1)
            model.Add(job_vars[j_id]["start"] == fixed_start_min)
            model.Add(job_vars[j_id]["end"] == fixed_end_min)

            if fj.assigned_crew_id and "crew_choice_vars" in job_vars[j_id]:
                if fj.assigned_crew_id in job_vars[j_id]["crew_choice_vars"]:
                    model.Add(job_vars[j_id]["crew_choice_vars"][fj.assigned_crew_id] == 1)
