"""
Objective configuration and model objective formulation for block optimization.
"""
from ortools.sat.python import cp_model
from typing import Dict, Any, List

# Configurable prototype optimization weights
DEFAULT_WEIGHTS = {
    "PRIORITY_WEIGHT": 1000,       # Scale factor for scheduled job priority score
    "BLOCK_DURATION_WEIGHT": 1,    # Penalty per minute of corridor block time
    "FRAGMENTATION_WEIGHT": 5,     # Penalty per separate maintenance block
    "LATENESS_WEIGHT": 1,          # Mild penalty for finishing later in the day or after deadline
    "ALIGNMENT_WEIGHT": 10,        # Reward for aligning start times of compatible jobs on same section
    "MOVED_JOB_PENALTY": 50,       # Penalty for moving a previously scheduled job away from original start
}

def apply_objective(
    model: cp_model.CpModel,
    job_vars: Dict[str, Any],
    jobs: List[Any],
    weights: Dict[str, int] = DEFAULT_WEIGHTS,
    snapshot: Any = None
):
    """
    Builds the CP-SAT maximization objective:
    Maximize:
        Sum( Priority_Weight * priority_score * is_scheduled )
        + Alignment_Reward (pairs of jobs on same section overlapping/sharing start)
        - Lateness_Weight * (start time)
        - Moved_Job_Penalty * deviation_from_previous_schedule
    """
    objective_terms = []

    for job in jobs:
        j_id = job.job_id
        is_scheduled = job_vars[j_id]["is_scheduled"]
        start_var = job_vars[j_id]["start"]

        # Scaled priority reward (integer arithmetic for CP-SAT)
        scaled_priority = int(job.priority_score * weights["PRIORITY_WEIGHT"])
        objective_terms.append(is_scheduled * scaled_priority)

        # Mild lateness penalty (encourages earlier completion within day without overpowering priority)
        objective_terms.append(start_var * (-weights["LATENESS_WEIGHT"]))

        # Replanning penalty: if job had a previous schedule and was moved
        if snapshot and snapshot.mode == "REPLAN" and snapshot.previous_schedule:
            if j_id in snapshot.previous_schedule:
                from time_utils import time_to_minutes
                old_start_min = time_to_minutes(snapshot.previous_schedule[j_id].start_time)

                # Deviation variable: |start - old_start|
                diff_var = model.NewIntVar(0, 1440, f"diff_{j_id}")
                model.Add(diff_var >= start_var - old_start_min)
                model.Add(diff_var >= old_start_min - start_var)
                objective_terms.append(diff_var * (-weights.get("MOVED_JOB_PENALTY", 50)))

    # Encourage consolidation: compatible jobs on the same section that overlap/align start time
    for i in range(len(jobs)):
        for j in range(i + 1, len(jobs)):
            j1 = jobs[i]
            j2 = jobs[j]
            if j1.section_id == j2.section_id:
                # Boolean variable: same_start
                same_start = model.NewBoolVar(f"same_start_{j1.job_id}_{j2.job_id}")
                # Enforce: same_start == 1 => start1 == start2
                model.Add(job_vars[j1.job_id]["start"] == job_vars[j2.job_id]["start"]).OnlyEnforceIf(same_start)
                # If both scheduled, bonus for same start
                both_sched = model.NewBoolVar(f"both_{j1.job_id}_{j2.job_id}")
                model.AddBoolAnd([job_vars[j1.job_id]["is_scheduled"], job_vars[j2.job_id]["is_scheduled"], same_start]).OnlyEnforceIf(both_sched)
                objective_terms.append(both_sched * weights["ALIGNMENT_WEIGHT"])

    model.Maximize(sum(objective_terms))
