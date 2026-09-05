# Railway Block Planning & Optimization Service (Python)

This service is a pure planning microservice that runs **Google OR-Tools CP-SAT** to produce optimized, consolidated daily railway maintenance blocks.

## Role & Responsibilities
- Receives a normalized Planning Snapshot JSON over HTTP `POST /optimize`.
- Converts timeline to minute-from-midnight integer variables.
- Models and enforces hard constraints:
  - Planning window feasibility ($T_{start} \le \text{start} \le \text{end} \le T_{end}$)
  - Operational train movement conflicts (track-block jobs cannot overlap trains on the same section)
  - Freight forecast occupancy windows (conservatively modeled as blocked operational windows)
  - Corridor restrictions (UNAVAILABLE/RESTRICTED intervals)
  - Crew conflict prevention (a crew cannot perform multiple overlapping jobs)
  - Resource conflicts (shared machines/equipment capacity limits)
- Maximizes total priority of scheduled jobs with mild penalties for block duration and lateness.
- Consolidates overlapping or contiguous compatible departmental jobs into unified maintenance blocks.
- Returns an Optimized Plan JSON with metrics and unscheduled job reasons.

## Running Locally
```bash
pip install -r requirements.txt
uvicorn app:app --port 8000 --reload
```

## Running Tests
```bash
pytest
```
