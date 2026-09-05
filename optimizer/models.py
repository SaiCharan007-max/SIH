from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Input Models (Planning Snapshot) ---

class PlanningWindow(BaseModel):
    start: str  # "06:00"
    end: str    # "22:00"

class SectionInput(BaseModel):
    section_id: str
    section_code: Optional[str] = None

class JobResourceInput(BaseModel):
    resource_type: Optional[str] = None
    resource_name: str
    quantity: int = 1

class JobInput(BaseModel):
    job_id: str
    section_id: str
    department: str
    duration_minutes: int
    priority_score: float = 50.0
    priority_level: Optional[str] = "MEDIUM"
    criticality: Optional[float] = 5.0
    urgency: Optional[float] = 5.0
    overdue_days: Optional[float] = 0.0
    deadline: Optional[str] = None
    requires_track_block: bool = True
    requires_power_shutdown: bool = False
    requires_signal_shutdown: bool = False
    crew_ids: List[str] = Field(default_factory=list)
    resources: List[JobResourceInput] = Field(default_factory=list)

class CrewInput(BaseModel):
    crew_id: str
    department: str
    capacity: int = 1
    active: bool = True

class TrainMovementInput(BaseModel):
    section_id: str
    entry_time: str
    exit_time: str
    priority: Optional[str] = "NORMAL"

class FreightForecastInput(BaseModel):
    section_id: str
    expected_entry_time: str
    expected_exit_time: str
    expected_train_count: Optional[int] = 1
    confidence: Optional[float] = 1.0

class CorridorRestrictionInput(BaseModel):
    section_id: str
    start_time: str
    end_time: str
    status: str  # UNAVAILABLE, RESTRICTED, AVAILABLE

class FrozenJobInput(BaseModel):
    job_id: str
    start_time: str
    end_time: str
    assigned_crew_id: Optional[str] = None

class PreviousJobSchedule(BaseModel):
    start_time: str
    end_time: str

class PlanningSnapshot(BaseModel):
    plan_date: str
    planning_window: PlanningWindow
    mode: str = "INITIAL"  # "INITIAL" or "REPLAN"
    sections: List[SectionInput] = Field(default_factory=list)
    jobs: List[JobInput] = Field(default_factory=list)
    crews: List[CrewInput] = Field(default_factory=list)
    train_movements: List[TrainMovementInput] = Field(default_factory=list)
    freight_forecasts: List[FreightForecastInput] = Field(default_factory=list)
    corridor_restrictions: List[CorridorRestrictionInput] = Field(default_factory=list)
    frozen_jobs: List[FrozenJobInput] = Field(default_factory=list)
    replan_jobs: List[str] = Field(default_factory=list)
    previous_schedule: Dict[str, PreviousJobSchedule] = Field(default_factory=dict)

# --- Output Models (Optimized Plan) ---

class ScheduledBlockJob(BaseModel):
    job_id: str
    start_time: str
    end_time: str
    assigned_crew_id: Optional[str] = None
    deadline_met: Optional[bool] = True
    old_start: Optional[str] = None
    old_end: Optional[str] = None
    moved: Optional[bool] = False

class MaintenanceBlockOutput(BaseModel):
    block_code: str
    section_id: str
    start_time: str
    end_time: str
    jobs: List[ScheduledBlockJob]

class UnscheduledJobOutput(BaseModel):
    job_id: str
    reason: str  # NO_FEASIBLE_WINDOW, NO_ASSIGNED_CREW, CREW_CONFLICT, RESOURCE_CONFLICT, DEADLINE_CONFLICT, OPERATIONAL_CONFLICT, OUTSIDE_PLANNING_WINDOW

class OptimizationMetrics(BaseModel):
    jobs_considered: int
    jobs_scheduled: int
    jobs_unscheduled: int
    scheduled_priority_value: float
    total_maintenance_minutes: int
    total_block_minutes: int
    block_savings_minutes: int
    deadline_met_count: int
    deadline_missed_count: int

class OptimizedPlanOutput(BaseModel):
    plan_date: str
    status: str = "PROPOSED"
    blocks: List[MaintenanceBlockOutput]
    unscheduled_jobs: List[UnscheduledJobOutput]
    metrics: OptimizationMetrics
    solver_status: Optional[str] = "OPTIMAL"
