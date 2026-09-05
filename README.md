# AI-Powered Automatic Block Planning for Indian Railways

Prototype implementation for **Smart India Hackathon 2026** problem statement **SIH26027**:
> *"AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways"*

---

## 1. Problem Statement Overview (SIH26027)

Indian Railways operates one of the world's densest and most complex rail networks. Maintaining high track and infrastructure reliability requires frequent maintenance windows—termed **Maintenance Blocks** (traffic blocks, power blocks, or both).

### Challenges:
- **Inter-Departmental Silos**: Infrastructure maintenance is split across three major technical departments:
  1. **Engineering (Civil / Track / P-Way)**
  2. **Traction Distribution (TRD / Electrical)**
  3. **Signal & Telecom (S&T)**
  Without coordinated scheduling, blocks requested independently cause redundant traffic disruptions.
- **Traffic Disruption vs. Asset Health**: Granting maintenance blocks during peak hours directly degrades train punctuality. Conversely, deferring maintenance leads to asset failures, temporary speed restrictions (TSR), and safety hazards.
- **Manual & Decentralized Planning**: Currently, block planning across divisions and sections involves complex manual coordination among section controllers, chief controllers, and departmental engineers.

### Objective:
Build an intelligent, automated block planning system that:
- Optimally schedules required maintenance blocks across sections.
- Synthesizes integrated (corridor) blocks where multiple departments perform work simultaneously in the same shadow window.
- Minimizes punctuality loss and passenger/freight train disruptions while maximizing physical asset health and availability.

---

## 2. High-Level Purpose of this Prototype

This prototype provides an end-to-end framework to demonstrate:
1. Representation of railway topology focused on **Railway Sections**, Stations, and department-specific **Assets**.
2. Capture and management of **Maintenance Jobs** alongside timetable-based **Train Movements**.
3. Automated scheduling and conflict-detection engines that produce recommended **Maintenance Block** schedules.
4. Decision-support dashboards for controllers and engineers to inspect, validate, and adjust proposed schedules.

---

## 3. Technology Stack

- **Backend**: Node.js, Express.js (ES Modules)
- **Database**: PostgreSQL
- **Optimization & ML Engine** *(Upcoming Phase)*: Python (Mathematical programming, heuristic solvers, OR-Tools)
- **Frontend Dashboard** *(Upcoming Phase)*: React
- **Containerization & Deployment** *(Upcoming Phase)*: Docker

---

## 4. Current Project Status & Incremental Roadmap

We are developing this system **incrementally**.

- **Current Status**:
  - **Phase 1: Foundation & Domain Model Skeleton**:
    - Repository structure initialized with ES Modules.
    - PostgreSQL connection pool configured via environment variables.
    - Health monitoring endpoint at `GET /api/health`.
  - **Phase 2: Railway Infrastructure Domain**:
    - PostgreSQL schema for `stations`, `railway_sections`, and `assets`.
    - Migration system with transaction-safe `.sql` scripts.
    - Fictional railway network seed data.
  - **Phase 3: Maintenance Management Domain**:
    - Schema for `crews`, `maintenance_jobs`, `maintenance_job_assignments`, and `maintenance_job_resources`.
    - Representative maintenance jobs and crews across Engineering, Traction Distribution, and S&T.
    - Modular 4-tier backend architecture: Routes -> Controllers -> Services -> Repositories.
    - Maintenance job CRUD APIs: `POST /api/maintenance/jobs`, `GET /api/maintenance/jobs` (with query filters), `GET /api/maintenance/jobs/:id`, `PATCH /api/maintenance/jobs/:id`.
    - Automated test suites for database invariants and API functionality.
  - **Phase 4: Train Operations & Corridor Domain**:
    - Schema for `trains`, `train_routes`, `train_movements`, `freight_forecasts`, and `corridor_availability`.
    - Train movement tracking through railway sections with scheduled and actual timestamps.
    - Free corridor window calculation engine merging train occupancies and operational restrictions.
    - Operations APIs: `/api/trains`, `/api/train-routes`, `/api/train-movements`, `/api/freight-forecasts`, `/api/corridor/availability`.
  - **Phase 5: Maintenance Priority Engine**:
    - Explainable, deterministic weighted scoring model ranking maintenance jobs on a 0–100 scale.
    - Configurable weights and normalization across criticality, urgency, overdue days, deadline proximity, and asset status risk.
    - Priority classification (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and deterministic tie-breaking.
    - Priority ranking API: `GET /api/maintenance/priorities` with query filters and reference date simulation.
    - Comprehensive unit and scenario verification suite.
  - **Phase 6: Constraint-Based Block Planning & Optimization Engine**:
    - Google OR-Tools CP-SAT formulation for multi-department maintenance block consolidation.
    - Python microservice with FastAPI/Uvicorn (`/optimize`), stateless constraint solving.
    - Conflict-free scheduling around operational passenger/freight timetables.
  - **Phase 7: Dynamic Replanning & Disruption Recovery**:
    - Event impact analysis engine (`planningImpact.service.js`) detecting affected sections, blocks, and shared resources.
    - Schedule invariance preservation freezing unaffected work.
    - Transactional plan versioning (`planning_runs`, status `PROPOSED` vs `SUPERSEDED`).
    - Multi-run diff comparison engine (`planningComparison.service.js`).
  - **Phase 8: Frontend Planning Dashboard & Visualization**:
    - Interactive React + Tailwind CSS operational planning client (`frontend/`).
    - **Planning Dashboard** (`/dashboard`): Operational KPIs, active block metrics, planning pipeline explanation, and audit trail ledger.
    - **Daily Block Timeline** (`/planning`): Dual-track section timeline (06:00 to 22:00) showing train movements and consolidated blocks with nested departmental jobs.
    - **Maintenance Priority Directory** (`/maintenance`): Ranked work orders with backend priority scores, criticality, urgency, and multi-attribute filters.
    - **Dynamic Replan Comparison** (`/planning/compare`): Version diff auditor highlighting moved jobs, newly scheduled work, and frozen invariants.
    - **Railway Network Topology** (`/network`): Interactive logical diagram of stations, track sections, electrification, and installed assets.

---

## 5. Repository Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # PostgreSQL pool configuration
│   │   ├── controllers/            # Request handlers
│   │   ├── services/               # Business logic
│   │   ├── repositories/           # Database access layer
│   │   ├── routes/
│   │   │   └── health.routes.js    # Health check route
│   │   ├── middleware/             # Express middlewares
│   │   ├── utils/                  # Shared helper functions
│   │   ├── app.js                  # Express application setup
│   │   └── server.js               # Server entry point
│   ├── package.json
│   └── .env.example
│
├── optimizer/
│   ├── app.py                      # FastAPI microservice (/optimize)
│   ├── solver.py                   # OR-Tools CP-SAT formulation
│   ├── constraints.py              # Operational and frozen job constraints
│   ├── objective.py                # Multi-objective optimization with move penalty
│   ├── models.py                   # Pydantic planning schemas
│   └── test_optimizer.py           # Optimizer test suite (pytest)
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Timeline, block detail, modals, topology graph
│   │   ├── pages/                  # Dashboard, Planning, Maintenance, Network, Compare
│   │   ├── services/api.js         # Centralized backend API client
│   │   └── utils/                  # Timeline coordinate math & department styles
│   ├── package.json
│   └── vite.config.js
│
├── data/
│   ├── network/                    # Railway network topology datasets
│   ├── trains/                     # Train timetable datasets
│   └── maintenance/                # Maintenance job datasets
│
├── docs/
│   └── domain-model.md             # Conceptual domain model specification
│
├── .gitignore
└── README.md
```

---

## 6. Getting Started (Backend)

### Prerequisites
- Node.js (v18+ recommended, tested on v24)
- npm

### Installation
Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

### Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your `PORT` and `DATABASE_URL` as needed in `.env`.

### Database Migrations, Seeding & Testing
```bash
# Run pending PostgreSQL migrations
npm run migrate

# Seed development network and maintenance data
npm run seed

# Run infrastructure database schema verification
npm run verify-db

# Run maintenance management domain verification suite
npm run verify-maintenance

# Run train operations & corridor availability verification suite
npm run verify-operations

# Run maintenance priority engine verification suite
npm run verify-priority
```

### Running the Backend

- **Development Mode** (with hot-reloading via `nodemon`):
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm start
  ```

- **Verify Health Endpoint**:
  ```bash
  curl http://localhost:5000/api/health
  ```
  Expected output:
  ```json
  {
    "status": "ok",
    "service": "railway-maintenance-planner"
  }
  ```

### API Endpoints Overview

#### Maintenance Management & Prioritization
- `POST /api/maintenance/jobs` - Create a maintenance job
- `GET /api/maintenance/jobs` - List jobs with optional query filters (`department`, `section_id`, `asset_id`, `status`, `criticality`, `urgency`)
- `GET /api/maintenance/jobs/:id` - Fetch detailed job with crew assignments and resource requirements
- `PATCH /api/maintenance/jobs/:id` - Update status, criticality, urgency, duration, or schedule
- `GET /api/maintenance/priorities` - Calculate explainable priority ranking for plannable maintenance jobs (filters: `department`, `section_id`, `priority_level`, `reference_date`)

#### Train Operations & Corridor
- `POST /api/trains` - Register a train service
- `GET /api/trains` - List trains with filters (`train_type`, `priority`, `active`)
- `GET /api/trains/:id` - Get single train details
- `PATCH /api/trains/:id` - Update train metadata
- `POST /api/train-routes` - Define a train route instance for a service date
- `GET /api/train-routes` - List train routes
- `POST /api/train-movements` - Log/schedule a train movement through a section
- `GET /api/train-movements` - List train movements with filters (`section_id`, `date`, `status`)
- `POST /api/freight-forecasts` - Add freight rake forecasts from Control Office
- `GET /api/freight-forecasts` - List freight forecasts
- `GET /api/corridor/availability` - Calculate free corridor windows and detect conflicts for a section/date horizon
- `POST /api/corridor/availability` - Register operational baseline corridor restrictions


