import pytest
from models import (
    PlanningSnapshot, PlanningWindow, SectionInput, JobInput,
    CrewInput, TrainMovementInput, FreightForecastInput,
    CorridorRestrictionInput, JobResourceInput
)
from time_utils import time_to_minutes, minutes_to_time, intervals_overlap
from solver import solve_planning_snapshot

def test_time_conversion():
    assert time_to_minutes("00:00") == 0
    assert time_to_minutes("06:00") == 360
    assert time_to_minutes("10:30") == 630
    assert time_to_minutes("22:00") == 1320
    assert minutes_to_time(360) == "06:00"
    assert minutes_to_time(630) == "10:30"
    assert intervals_overlap(100, 200, 150, 250) is True
    assert intervals_overlap(100, 200, 200, 300) is False
    assert intervals_overlap(100, 200, 50, 100) is False

def test_demo_scenario_consolidation():
    """
    Demonstrates the core SIH requirement:
    3 compatible jobs from different departments on SEC-A12 are consolidated into ONE block
    during 12:00-14:00 around train and freight movements.
    """
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="12:00", end="18:00"),
        sections=[SectionInput(section_id="SEC-A12", section_code="A-B")],
        jobs=[
            JobInput(
                job_id="JOB-ENG-01",
                section_id="SEC-A12",
                department="ENGINEERING",
                duration_minutes=120,
                priority_score=92.0,
                requires_track_block=True,
                crew_ids=["CREW-ENG-01"]
            ),
            JobInput(
                job_id="JOB-TRD-01",
                section_id="SEC-A12",
                department="TRACTION_DISTRIBUTION",
                duration_minutes=90,
                priority_score=84.0,
                requires_track_block=True,
                crew_ids=["CREW-TRD-01"]
            ),
            JobInput(
                job_id="JOB-SNT-01",
                section_id="SEC-A12",
                department="SIGNAL_TELECOM",
                duration_minutes=60,
                priority_score=79.0,
                requires_track_block=True,
                crew_ids=["CREW-SNT-01"]
            )
        ],
        crews=[
            CrewInput(crew_id="CREW-ENG-01", department="ENGINEERING", active=True),
            CrewInput(crew_id="CREW-TRD-01", department="TRACTION_DISTRIBUTION", active=True),
            CrewInput(crew_id="CREW-SNT-01", department="SIGNAL_TELECOM", active=True),
        ],
        train_movements=[
            TrainMovementInput(section_id="SEC-A12", entry_time="10:00", exit_time="10:20"),
            TrainMovementInput(section_id="SEC-A12", entry_time="10:45", exit_time="11:05"),
            TrainMovementInput(section_id="SEC-A12", entry_time="11:40", exit_time="12:00"),
        ],
        freight_forecasts=[
            FreightForecastInput(section_id="SEC-A12", expected_entry_time="15:00", expected_exit_time="15:20"),
        ],
        corridor_restrictions=[]
    )

    result = solve_planning_snapshot(snapshot)

    assert result.metrics.jobs_scheduled == 3
    assert result.metrics.jobs_unscheduled == 0
    # Must consolidate into 1 block!
    assert len(result.blocks) == 1

    block = result.blocks[0]
    assert block.section_id == "SEC-A12"
    assert len(block.jobs) == 3
    # Duration of block should be 120 minutes (12:00 to 14:00)
    assert block.start_time == "12:00"
    assert block.end_time == "14:00"
    # Block savings = 120 + 90 + 60 - 120 = 150 minutes
    assert result.metrics.block_savings_minutes == 150
    assert result.metrics.total_block_minutes == 120
    assert result.metrics.total_maintenance_minutes == 270

def test_train_conflict_prevention():
    """
    Ensures jobs cannot overlap train movements on the same section.
    """
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="10:00", end="11:00"),
        sections=[SectionInput(section_id="SEC-A12")],
        jobs=[
            JobInput(
                job_id="JOB-1",
                section_id="SEC-A12",
                department="ENGINEERING",
                duration_minutes=40,
                priority_score=90.0,
                crew_ids=["CREW-1"]
            )
        ],
        crews=[CrewInput(crew_id="CREW-1", department="ENGINEERING", active=True)],
        # Train occupies 10:15 to 10:45, leaving at most 15 min windows -> a 40 min job cannot fit!
        train_movements=[
            TrainMovementInput(section_id="SEC-A12", entry_time="10:15", exit_time="10:45")
        ],
        freight_forecasts=[],
        corridor_restrictions=[]
    )

    result = solve_planning_snapshot(snapshot)
    assert result.metrics.jobs_scheduled == 0
    assert result.metrics.jobs_unscheduled == 1
    assert result.unscheduled_jobs[0].job_id == "JOB-1"

def test_crew_conflict_prevention():
    """
    Two jobs requiring the SAME crew cannot overlap.
    """
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="08:00", end="10:00"),
        sections=[SectionInput(section_id="SEC-A12")],
        jobs=[
            JobInput(job_id="JOB-A", section_id="SEC-A12", department="ENG", duration_minutes=60, priority_score=80.0, crew_ids=["CREW-1"]),
            JobInput(job_id="JOB-B", section_id="SEC-A12", department="ENG", duration_minutes=60, priority_score=70.0, crew_ids=["CREW-1"])
        ],
        crews=[CrewInput(crew_id="CREW-1", department="ENG", active=True)],
        train_movements=[],
        freight_forecasts=[],
        corridor_restrictions=[]
    )

    result = solve_planning_snapshot(snapshot)
    assert result.metrics.jobs_scheduled == 2
    # Check that job intervals do NOT overlap
    job_a = [j for b in result.blocks for j in b.jobs if j.job_id == "JOB-A"][0]
    job_b = [j for b in result.blocks for j in b.jobs if j.job_id == "JOB-B"][0]
    a_s = time_to_minutes(job_a.start_time)
    a_e = time_to_minutes(job_a.end_time)
    b_s = time_to_minutes(job_b.start_time)
    b_e = time_to_minutes(job_b.end_time)
    assert not intervals_overlap(a_s, a_e, b_s, b_e)

def test_resource_conflict_prevention():
    """
    Two jobs requiring the SAME equipment/resource cannot overlap.
    """
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="08:00", end="10:00"),
        sections=[SectionInput(section_id="SEC-A12")],
        jobs=[
            JobInput(
                job_id="JOB-A", section_id="SEC-A12", department="ENG", duration_minutes=60, priority_score=80.0, crew_ids=["CREW-1"],
                resources=[JobResourceInput(resource_name="TAMPING_MACHINE_01", quantity=1)]
            ),
            JobInput(
                job_id="JOB-B", section_id="SEC-A12", department="ENG", duration_minutes=60, priority_score=70.0, crew_ids=["CREW-2"],
                resources=[JobResourceInput(resource_name="TAMPING_MACHINE_01", quantity=1)]
            )
        ],
        crews=[
            CrewInput(crew_id="CREW-1", department="ENG", active=True),
            CrewInput(crew_id="CREW-2", department="ENG", active=True)
        ],
        train_movements=[],
        freight_forecasts=[],
        corridor_restrictions=[]
    )

    result = solve_planning_snapshot(snapshot)
    assert result.metrics.jobs_scheduled == 2
    job_a = [j for b in result.blocks for j in b.jobs if j.job_id == "JOB-A"][0]
    job_b = [j for b in result.blocks for j in b.jobs if j.job_id == "JOB-B"][0]
    a_s = time_to_minutes(job_a.start_time)
    a_e = time_to_minutes(job_a.end_time)
    b_s = time_to_minutes(job_b.start_time)
    b_e = time_to_minutes(job_b.end_time)
    assert not intervals_overlap(a_s, a_e, b_s, b_e)

def test_high_priority_preferred_over_low_priority():
    """
    When the window only fits one job, the higher-priority job is scheduled.
    """
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="08:00", end="09:00"), # 60 min window
        sections=[SectionInput(section_id="SEC-A12")],
        jobs=[
            JobInput(job_id="JOB-LOW", section_id="SEC-A12", department="ENG", duration_minutes=60, priority_score=40.0, crew_ids=["CREW-1"]),
            JobInput(job_id="JOB-HIGH", section_id="SEC-A12", department="ENG", duration_minutes=60, priority_score=95.0, crew_ids=["CREW-1"])
        ],
        crews=[CrewInput(crew_id="CREW-1", department="ENG", active=True)],
        train_movements=[],
        freight_forecasts=[],
        corridor_restrictions=[]
    )

    result = solve_planning_snapshot(snapshot)
    assert result.metrics.jobs_scheduled == 1
    assert result.metrics.jobs_unscheduled == 1
    scheduled_job_id = result.blocks[0].jobs[0].job_id
    assert scheduled_job_id == "JOB-HIGH"
    assert result.unscheduled_jobs[0].job_id == "JOB-LOW"

def test_freight_conflict_prevention():
    """
    Ensures jobs cannot overlap freight forecast occupancy on the same section.
    """
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="15:00", end="16:00"),
        sections=[SectionInput(section_id="SEC-A12")],
        jobs=[
            JobInput(job_id="JOB-F", section_id="SEC-A12", department="ENG", duration_minutes=45, priority_score=80.0, crew_ids=["CREW-1"])
        ],
        crews=[CrewInput(crew_id="CREW-1", department="ENG", active=True)],
        train_movements=[],
        freight_forecasts=[
            FreightForecastInput(section_id="SEC-A12", expected_entry_time="15:10", expected_exit_time="15:40")
        ],
        corridor_restrictions=[]
    )
    result = solve_planning_snapshot(snapshot)
    assert result.metrics.jobs_scheduled == 0
    assert result.metrics.jobs_unscheduled == 1

def test_corridor_restriction_prevention():
    """
    Ensures jobs cannot overlap UNAVAILABLE or RESTRICTED corridor intervals.
    """
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="14:00", end="16:00"),
        sections=[SectionInput(section_id="SEC-A12")],
        jobs=[
            JobInput(job_id="JOB-C", section_id="SEC-A12", department="ENG", duration_minutes=90, priority_score=80.0, crew_ids=["CREW-1"])
        ],
        crews=[CrewInput(crew_id="CREW-1", department="ENG", active=True)],
        train_movements=[],
        freight_forecasts=[],
        corridor_restrictions=[
            CorridorRestrictionInput(section_id="SEC-A12", start_time="14:30", end_time="15:30", status="UNAVAILABLE")
        ]
    )
    result = solve_planning_snapshot(snapshot)
    assert result.metrics.jobs_scheduled == 0
    assert result.metrics.jobs_unscheduled == 1

def test_inactive_crew_cannot_be_scheduled():
    """
    Jobs with only inactive crews cannot be scheduled.
    """
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="08:00", end="12:00"),
        sections=[SectionInput(section_id="SEC-A12")],
        jobs=[
            JobInput(job_id="JOB-INACTIVE", section_id="SEC-A12", department="ENG", duration_minutes=60, priority_score=85.0, crew_ids=["CREW-OFF"])
        ],
        crews=[CrewInput(crew_id="CREW-OFF", department="ENG", active=False)],
        train_movements=[],
        freight_forecasts=[],
        corridor_restrictions=[]
    )
    result = solve_planning_snapshot(snapshot)
    assert result.metrics.jobs_scheduled == 0
    assert result.unscheduled_jobs[0].reason == "NO_ASSIGNED_CREW"

def test_outside_planning_window_job():
    """
    Jobs whose duration exceeds the entire planning window must be unscheduled with OUTSIDE_PLANNING_WINDOW reason.
    """
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="08:00", end="09:00"), # 60 min window
        sections=[SectionInput(section_id="SEC-A12")],
        jobs=[
            JobInput(job_id="JOB-TOO-LONG", section_id="SEC-A12", department="ENG", duration_minutes=120, priority_score=90.0, crew_ids=["CREW-1"])
        ],
        crews=[CrewInput(crew_id="CREW-1", department="ENG", active=True)],
        train_movements=[],
        freight_forecasts=[],
        corridor_restrictions=[]
    )
    result = solve_planning_snapshot(snapshot)
    assert result.metrics.jobs_scheduled == 0
    assert result.unscheduled_jobs[0].reason == "OUTSIDE_PLANNING_WINDOW"

def test_deterministic_result_for_identical_input():
    """
    Runs the solver twice with identical input and checks that outputs are identical.
    """
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="06:00", end="12:00"),
        sections=[SectionInput(section_id="SEC-A12")],
        jobs=[
            JobInput(job_id="JOB-D1", section_id="SEC-A12", department="ENG", duration_minutes=60, priority_score=80.0, crew_ids=["CREW-1"]),
            JobInput(job_id="JOB-D2", section_id="SEC-A12", department="ENG", duration_minutes=60, priority_score=70.0, crew_ids=["CREW-1"])
        ],
        crews=[CrewInput(crew_id="CREW-1", department="ENG", active=True)],
        train_movements=[],
        freight_forecasts=[],
        corridor_restrictions=[]
    )
    r1 = solve_planning_snapshot(snapshot)
    r2 = solve_planning_snapshot(snapshot)
    assert r1.metrics.jobs_scheduled == r2.metrics.jobs_scheduled
    assert r1.metrics.total_block_minutes == r2.metrics.total_block_minutes
    assert len(r1.blocks) == len(r2.blocks)
    assert r1.blocks[0].start_time == r2.blocks[0].start_time

def test_replan_preserves_frozen_jobs_and_moves_affected():
    """
    Verifies that in REPLAN mode, frozen jobs remain exactly at their fixed start/end times,
    while affected replannable jobs are rescheduled to accommodate the disruption.
    """
    from models import FrozenJobInput, PreviousJobSchedule

    # Initial scenario: JOB-A was 12:00-14:00, JOB-B was 12:00-13:30 (TRD), JOB-C was 12:00-13:00 (SNT)
    # Now JOB-A had an overrun until 15:00! So JOB-A is frozen at 12:00-15:00.
    # JOB-B and JOB-C must move after 15:00.
    snapshot = PlanningSnapshot(
        plan_date="2026-09-10",
        planning_window=PlanningWindow(start="12:00", end="18:00"),
        mode="REPLAN",
        sections=[SectionInput(section_id="SEC-A12")],
        jobs=[
            JobInput(
                job_id="JOB-A", section_id="SEC-A12", department="ENG", duration_minutes=180, priority_score=92.0, crew_ids=["CREW-ENG"],
                resources=[JobResourceInput(resource_name="OHE_LADDER_TROLLEY", quantity=1)]
            ),
            JobInput(
                job_id="JOB-B", section_id="SEC-A12", department="TRD", duration_minutes=90, priority_score=84.0, crew_ids=["CREW-TRD"],
                resources=[JobResourceInput(resource_name="OHE_LADDER_TROLLEY", quantity=1)]
            ),
            JobInput(job_id="JOB-C", section_id="SEC-A12", department="SNT", duration_minutes=60, priority_score=79.0, crew_ids=["CREW-SNT"])
        ],
        crews=[
            CrewInput(crew_id="CREW-ENG", department="ENG", active=True),
            CrewInput(crew_id="CREW-TRD", department="TRD", active=True),
            CrewInput(crew_id="CREW-SNT", department="SNT", active=True),
        ],
        frozen_jobs=[
            FrozenJobInput(job_id="JOB-A", start_time="12:00", end_time="15:00", assigned_crew_id="CREW-ENG")
        ],
        replan_jobs=["JOB-B", "JOB-C"],
        previous_schedule={
            "JOB-A": PreviousJobSchedule(start_time="12:00", end_time="14:00"),
            "JOB-B": PreviousJobSchedule(start_time="12:00", end_time="13:30"),
            "JOB-C": PreviousJobSchedule(start_time="12:00", end_time="13:00")
        },
        train_movements=[],
        freight_forecasts=[],
        corridor_restrictions=[]
    )

    result = solve_planning_snapshot(snapshot)

    assert result.metrics.jobs_scheduled == 3
    # Find jobs in blocks
    job_map = {j.job_id: j for b in result.blocks for j in b.jobs}

    # 1. Frozen job JOB-A MUST be exactly 12:00 - 15:00
    assert job_map["JOB-A"].start_time == "12:00"
    assert job_map["JOB-A"].end_time == "15:00"

    # 2. Replanned job JOB-B had a resource conflict with JOB-A so it MUST move at or after 15:00
    assert time_to_minutes(job_map["JOB-B"].start_time) >= 900  # 15:00
    assert job_map["JOB-B"].moved is True
