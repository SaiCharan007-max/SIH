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

- **Current Status (Phase 1: Foundation & Domain Model Skeleton)**:
  - Repository structure initialized.
  - Node.js + Express backend foundation created using ES Modules.
  - Basic dependencies configured (`express`, `dotenv`, `cors`, `pg`, `nodemon`).
  - Core `/api/health` monitoring endpoint implemented and verified.
  - PostgreSQL connection module configured via environment variables.
  - Initial conceptual domain model specified in [`docs/domain-model.md`](docs/domain-model.md).
- **Upcoming Phases**:
  - Phase 2: Relational database schema design and migrations (PostgreSQL).
  - Phase 3: Network and timetable data ingestion services.
  - Phase 4: Python optimization module integration.
  - Phase 5: Interactive React frontend dashboard.

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
│   └── README.md                   # Future Python optimization module
│
├── frontend/
│   └── README.md                   # Future React frontend dashboard
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
