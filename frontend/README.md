# SIH26027 — Frontend Planning Dashboard & Visualization

Professional railway maintenance block planning dashboard and decision-support web client for:
**SIH26027: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways**

---

## 1. Quick Start

### Prerequisites
- Node.js >= 18.0.0 (Node 20+ recommended)
- Backend running on `http://localhost:5000`
- Python OR-Tools CP-SAT optimizer running on `http://localhost:8000`

### Installation & Execution
```bash
cd frontend
npm install
npm run dev
```

The application will start at: **`http://localhost:5173/`**

### Running Automated Frontend Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## 2. Environment Variables

Create a `.env` or `.env.local` in `frontend/` if connecting to a custom backend port:

```env
VITE_API_URL=http://localhost:5000/api
```
*(Default fallback is `http://localhost:5000/api`)*

---

## 3. Page Structure & Route Map

| Route | Page | Description |
| :--- | :--- | :--- |
| `/dashboard` | **Dashboard** | Operational KPIs (Total jobs, critical tasks, scheduled vs unscheduled, block savings, deadline compliance), planning intelligence pipeline explanation, and historical runs ledger. |
| `/planning` | **Daily Planning** | Core operational timeline (06:00 to 22:00) with dual channels per railway section (train movements & multi-department maintenance blocks), block detail inspector, unscheduled work breakdown, and disruption simulator. |
| `/maintenance`| **Maintenance Jobs** | Complete work order directory ranked deterministically by the backend Priority Engine, with multi-attribute department/status filters and card/table toggles. |
| `/network` | **Railway Network** | Interactive logical topology diagram displaying station nodes, track section edges, electrification indicators, installed assets, and active corridor blocks. |
| `/planning/compare` | **Plan Comparison**| Audit comparison view diffing historical base plans against revised dynamic replans with KPI summaries and schedule invariance deltas (`MOVED`, `UNCHANGED`). |

---

## 4. Operational Planning Flow

1. **Review Maintenance Demands**: Planner inspects the `/maintenance` directory where work orders from Civil Engineering, Traction Distribution, and S&T are prioritized based on asset risk, speed restrictions, and due dates.
2. **Generate Initial Block Plan**: On `/planning`, click **"Generate Plan"**. Node.js aggregates operational train timetables and maintenance requests into a normalized planning snapshot, invokes OR-Tools CP-SAT, and renders consolidated blocks on the timeline.
3. **Inspect Coordinated Multi-Department Blocks**: Clicking any block opens the `BlockDetailModal` showing consolidated work duration, track downtime saved, participating departments, and nested job schedules.

---

## 5. Timeline Design Architecture

The timeline visualization avoids heavy third-party charting libraries in favor of a performant, lightweight SVG and flexbox layout:
- **Time Horizon**: `06:00` (minute 360) to `22:00` (minute 1320), spanning 960 total operational minutes.
- **Coordinate Formula**:
  - `leftPct = ((startMinutes - 360) / 960) * 100%`
  - `widthPct = ((endMinutes - startMinutes) / 960) * 100%`
- **Dual-Channel Multi-Track Representation**:
  - **Upper Track Channel**: Passenger and freight train movements (blue/slate bars with train number and entry/exit times).
  - **Lower Track Channel**: Consolidated maintenance blocks (amber/emerald borders) enclosing nested departmental strips (`ENG`, `TRD`, `S&T`).
- **Horizontal Scroll**: Gracefully supports desktop resolutions from `1366x768` to `4K` with unified sticky time axis headers.

---

## 6. Disruption Simulation & Dynamic Replanning Flow

1. Click **"Simulate Disruption"** on `/planning`.
2. Select one of 6 perturbation event types:
   - `MAINTENANCE_OVERRUN`: Job welding/tamping delay pushes actual completion time.
   - `TRAIN_DELAY`: Upstream delay shifts train occupancy window.
   - `TRAIN_CANCELLATION`: Train cancellation frees corridor window.
   - `EMERGENCY_MAINTENANCE`: Rail fracture or OHE detachment (Priority 10).
   - `CREW_UNAVAILABLE`: Assigned crew goes off-duty.
   - `CORRIDOR_RESTRICTION_CHANGE`: Temporary speed or possession restriction imposed.
3. Click **"Generate Revised Plan"**.
4. The system executes impact analysis, freezes unaffected work, re-optimizes dependent jobs, and creates a versioned run (e.g. `RUN-002`, status `PROPOSED`).
5. Directly compare changes on `/planning/compare` to verify that unaffected work remained strictly frozen while conflicting jobs were shifted safely.

---

## 7. Safety Notice

> **Decision-Support Notice**: All dynamically generated schedules are marked as **`PROPOSED`** with prominent banners: *"AI-generated proposal — requires operational review"*. The system serves as intelligent decision-support for Indian Railways Section Controllers and does not autonomously issue movement authorities.
