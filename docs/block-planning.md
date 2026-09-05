# Maintenance Block Planning & Optimization

## 1. Overview
The Maintenance Block Planning & Optimization Engine produces conflict-free, consolidated daily railway maintenance schedules for Indian Railways (SIH26027).

> **Core Philosophy**:
> *"AI/ML prioritizes and ranks maintenance work, while constraint optimization determines a feasible maintenance schedule."*

> [!IMPORTANT]
> Prototype compatibility rules are not a substitute for Indian Railways operating, engineering, electrical, signalling, or safety regulations.

---

## 2. Maintenance Job vs. Maintenance Block

| Concept | Maintenance Job | Maintenance Block |
| :--- | :--- | :--- |
| **Definition** | An individual maintenance activity requested by a department (Engineering, TRD, or S&T). | A reserved time interval during which train operations on a specific railway section are suspended or regulated to permit maintenance. |
| **Granularity** | P-Way gang, tower wagon, signal technician task. | Corridor traffic regulation window approved by Operating Control. |
| **Duration** | Task-specific (e.g. 60m, 90m, 120m). | Consolidated corridor span $[\min(\text{start}), \max(\text{end})]$. |
| **Database Entity** | `maintenance_jobs` | `maintenance_blocks` (associated via `maintenance_block_jobs`) |

---

## 3. Operational Constraints & Safety Modeling

### A. Train Occupancy & Movement Conflicts
For jobs requiring a track block (`requires_track_block = true`), the maintenance interval $[S_j, E_j]$ must not overlap any train movement $[S_t, E_t]$ on the same section:
$$[S_j < E_t] \land [E_j > S_t] \implies \text{Conflict}$$
In CP-SAT boolean terms:
$$\text{Scheduled}_j \implies (E_j \le S_t) \lor (S_j \ge E_t)$$

### B. Freight Forecast Conflicts
Freight forecasts are treated as operational occupancy windows:
- **Prototype Assumption**: Freight forecast intervals are treated as blocked operational windows in the prototype. Production deployment should use authoritative operating-control data and configurable uncertainty handling.

### C. Corridor Restrictions
Sections with status `UNAVAILABLE` or `RESTRICTED` in `corridor_availability` are blocked for track-block maintenance.

### D. Crew & Resource Constraints
- **Crews**: A maintenance crew cannot work on multiple simultaneous jobs.
- **Departments**: A job must use an active crew from its own department unless an explicit cross-department assignment exists.
- **Resources**: Named equipment items (e.g., tamping machines, rail cutters) have finite capacity (default 1) and cannot be double-booked across overlapping jobs.

---

## 4. Multi-Department Joint Block Consolidation

A central innovation of SIH26027 is the coordinated execution of compatible maintenance activities across departments:
- **Example**:
  - Engineering: `JOB-ENG-01` (120 minutes: 12:00–14:00)
  - Traction: `JOB-TRD-01` (90 minutes: 12:00–13:30)
  - S&T: `JOB-SNT-01` (60 minutes: 12:00–13:00)
- **Outcome**:
  - Total Maintenance Work Completed: $120 + 90 + 60 = 270\text{ minutes}$.
  - Infrastructure Block Time: $120\text{ minutes}$ (12:00 to 14:00).
  - Block Savings: $270 - 120 = 150\text{ minutes}$ of corridor track availability saved!

---

## 5. Mathematical Objective Function

CP-SAT solves a multi-criteria integer programming model:

$$\max \sum_{j \in \text{Jobs}} \Big( W_{\text{priority}} \cdot \text{PriorityScore}_j \cdot \text{Scheduled}_j - W_{\text{lateness}} \cdot \text{Start}_j \Big) + \sum_{(i, k) \in \text{CompatiblePairs}} W_{\text{align}} \cdot \text{AlignedStart}_{ik}$$

### Configurable Optimization Weights
```python
DEFAULT_WEIGHTS = {
    "PRIORITY_WEIGHT": 1000,      # Dominant weight ensuring critical jobs are preferred
    "BLOCK_DURATION_WEIGHT": 1,   # Penalty per minute of corridor block time
    "FRAGMENTATION_WEIGHT": 5,    # Penalty for creating extra distinct blocks
    "LATENESS_WEIGHT": 1,         # Encourages earlier execution in the planning day
    "ALIGNMENT_WEIGHT": 10        # Incentivizes parallel multi-department consolidation
}
```

---

## 6. Architecture & System Boundary

```
React (Future)
      │
      ▼
Node.js / Express (Port 5000)
      ├── Repositories & PostgreSQL (Tables: maintenance_blocks, maintenance_block_jobs)
      ├── Priority Engine (Scoring & Ranking)
      └── Planning Service (Snapshot generation & 13 Safety Validation checks)
      │  HTTP POST /optimize (JSON In / JSON Out)
      ▼
Python Optimization Microservice (Port 8000)
      └── Google OR-Tools CP-SAT (Pure Solver: no DB connection)
```

### Why OR-Tools CP-SAT?
1. **Discrete Minute Resolution**: CP-SAT handles finite integer time intervals with state-of-the-art exact propagation.
2. **Interval Variables**: Built-in support for `NewOptionalIntervalVar` and `AddNoOverlap` makes scheduling and shared crew/resource modeling concise and robust.
3. **Optimality Proofs**: Unlike heuristic genetic algorithms, CP-SAT can prove optimal window assignment or prove exact infeasibility.

### Why Node.js Owns Persistence?
- Preserves single source of truth for schema migrations and data access.
- Decouples the mathematical optimization engine as a stateless microservice suitable for scaling or swapping with alternative solvers.
