# Domain Model Skeleton: AI-Powered Automatic Block Planning

> **Note**: This document outlines a **simplified prototype domain model** created specifically for the Smart India Hackathon 2026 problem statement **SIH26027: "AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways"**. It does not claim or seek to represent the full, official, and exhaustive data model of Indian Railways.

---

## 1. Core Architectural & Modeling Principles

In standard passenger-facing applications, railway networks are often oversimplified as a set of stations connected by scheduled trains. **For maintenance planning and automatic block scheduling, this abstraction is insufficient and incorrect.**

### Key Realities for SIH26027:
1. **Sections are Primary**: Maintenance blocks take place on physical segments of line and infrastructure between stations or block cabins, known as **Railway Sections** (block sections, track circuits, or OHE sub-sectors). A block directly restricts train traversal across that physical infrastructure.
2. **Multi-Department Coordination**: Maintenance is requested and executed across three core operational departments:
   - **Engineering (Track / Civil / P-Way)**: Track renewal, tamping, deep screening, rail weld repair, bridge maintenance.
   - **Traction Distribution (Electrical / TRD)**: Overhead Equipment (OHE) inspection, catenary/contact wire adjustment, power isolation.
   - **Signal & Telecom (S&T)**: Point machine maintenance, track circuits, axle counters, electronic interlocking, signaling cables.
3. **Asset Availability vs. Punctuality**: A viable block planning system must maximize asset availability (preventing asset failures and speed restrictions) while minimizing punctuality loss and path disruption for timetabled passenger and freight trains.

---

## 2. Conceptual Entities

```
+-----------------------------------------------------------------------------------+
|                                 Station                                           |
+-----------------------------------------------------------------------------------+
        | connects                                                  | terminal/stop
        v                                                           v
+-------------------------+      located in       +---------------------------------+
|     Railway Section     |<----------------------|             Asset               |
+-------------------------+                       +---------------------------------+
        ^               ^                                   ^
        | occupies      | blocks                            | requires
        |               |                                   |
+-----------------+   +---------------------+   schedules +-------------------------+
| Train Movement  |   |  Maintenance Block  |<------------|    Maintenance Job      |
+-----------------+   +---------------------+             +-------------------------+
        ^                       | utilizes                          ^ requested by
        | operated as           v                                   |
+-----------------+   +---------------------+             +-------------------------+
|      Train      |   |        Crew         |<------------|       Department        |
+-----------------+   +---------------------+  belongs to +-------------------------+
```

---

### 2.1 Station
- **What it represents**: A recognized operational location, junction, or terminal on the railway network with passenger/freight handling facilities, yard facilities, or signaling interlockings.
- **Why it matters to SIH26027**: Stations delimit railway sections, serve as boundaries for train regulation and looping (siding/stabling trains when a downstream block is active), and provide points of origin or termination for maintenance machinery (e.g., track machines like BCM or CSM) and crew.
- **Key Relationships**:
  - Delimits two ends of one or more **Railway Sections** (Up/Down lines, bi-directional lines).
  - Contains station-area **Assets** (turnouts, points, platform lines, station signaling).
  - Serves as scheduled stopping points for **Train Movements**.

---

### 2.2 Railway Section
- **What it represents**: A distinct, physical stretch of track and overhead line between two stations or block cabins (e.g., Block Section, Automatic Signaling Section, or intermediate block post). It may consist of single, double, or multiple lines (Up line, Down line, 3rd/4th line).
- **Why it matters to SIH26027**: **Railway Sections are the focal point of maintenance blocks.** When maintenance is executed, line capacity on that specific section is restricted or completely halted (traffic block), and electrical power may be switched off (power block). The scheduler must understand section directionality, length, runtime, and capacity constraints.
- **Key Relationships**:
  - Bounded by adjacent **Stations**.
  - Contains physical **Assets** (rails, sleepers, OHE masts, catenary wires, signals, track circuits).
  - Traversed by **Train Movements** during operational windows.
  - Reserved and occupied by **Maintenance Blocks** during maintenance windows.

---

### 2.3 Asset
- **What it represents**: A specific physical infrastructure component situated within a railway section or station yard. Examples include a track section (P-Way), turnouts/crossovers, OHE tension lengths, signal heads, or axle counters.
- **Why it matters to SIH26027**: Asset health directly dictates line speed and safety. Unmaintained assets trigger temporary speed restrictions (TSR) or failures. The goal of block planning is to ensure every asset receives required preventive maintenance within its designated interval.
- **Key Relationships**:
  - Located on a specific **Railway Section** or within a **Station**.
  - Associated with a managing **Department** (Engineering, Traction Distribution, or S&T).
  - Targeted by one or more **Maintenance Jobs**.

---

### 2.4 Maintenance Job
- **What it represents**: A designated maintenance activity, work order, or inspection task that must be carried out on an asset. It defines required duration, periodicity, machine requirements (e.g., tie tamping machine, tower wagon), and required block type (traffic block, power block, or both).
- **Why it matters to SIH26027**: Represents the demand side of maintenance. Block requests originate from scheduled preventive maintenance cycles or urgent corrective requirements. Efficient planning combines or "shadows" multiple jobs across departments in the same section to reduce total line occupation.
- **Key Relationships**:
  - Targets one or more **Assets** in a **Railway Section**.
  - Initiated and supervised by a **Department**.
  - Executed by an assigned **Crew** (and accompanying machinery).
  - Scheduled into a concrete **Maintenance Block** window.

---

### 2.5 Department
- **What it represents**: The functional branch of railway engineering responsible for specific infrastructure disciplines.
  - **Engineering (Track / Civil)**
  - **Traction Distribution (TRD / Electrical)**
  - **Signal & Telecom (S&T)**
- **Why it matters to SIH26027**: The primary operational challenge in Indian Railways is inter-departmental block coordination. Historically, departments have worked in silos, leading to underutilized blocks and fragmented train disruption. SIH26027 focuses on integrated planning across all three departments to enable "integrated / corridor blocks".
- **Key Relationships**:
  - Owns and maintains designated **Assets**.
  - Employs and assigns maintenance **Crews** and specialized machines.
  - Submits **Maintenance Jobs** requiring block sanction.

---

### 2.6 Crew
- **What it represents**: The workforce, supervisors, machine operators, and safety personnel (e.g., gangmen, Junior Engineers, Section Engineers, tower wagon drivers) who execute the work on site.
- **Why it matters to SIH26027**: Crew and specialized machinery availability is a hard operational constraint. A block cannot be sanctioned merely because a track window exists—the designated gang, machine (e.g., track tamper), and safety staff must be available and stationed within commuting distance.
- **Key Relationships**:
  - Belongs to a **Department**.
  - Assigned to execute a **Maintenance Job** within a scheduled **Maintenance Block**.
  - Departs from and returns to a base **Station** or depot.

---

### 2.7 Train
- **What it represents**: A timetabled operational service with a designated train number, category, priority, and frequency (e.g., Vande Bharat, Rajdhani, Express/Mail, Suburban EMU, Freight/Goods).
- **Why it matters to SIH26027**: Trains define the revenue-generating, passenger-carrying operational timetable. Different trains have distinct priority rankings; blocking an express train incurs severe punctuality penalties, whereas scheduling blocks during natural timetable margins or freight slack hours is preferred.
- **Key Relationships**:
  - Realized through specific scheduled **Train Movements**.

---

### 2.8 Train Movement
- **What it represents**: The planned or actual movement of a Train across a specific Railway Section at a given time window (Section Entry Time and Section Exit Time).
- **Why it matters to SIH26027**: Timetables translate into physical section occupancy. A block planning engine must detect conflicts between proposed **Maintenance Blocks** and planned **Train Movements** on the same or adjacent track lines.
- **Key Relationships**:
  - Associated with a parent **Train**.
  - Traverses a designated **Railway Section** connecting consecutive **Stations**.
  - Constrains the viable scheduling window for **Maintenance Blocks**.

---

### 2.9 Maintenance Block
- **What it represents**: An approved or proposed temporal window during which regular train traffic is suspended (traffic block) and/or overhead traction power is de-energized (power block) on a specific Railway Section to permit safe maintenance work.
- **Why it matters to SIH26027**: This is the primary output of the planning system. An AI-powered block planner computes optimal block start times, durations, and sections such that required maintenance is accomplished while minimizing train delays, rescheduling, and cancellations.
- **Key Relationships**:
  - Imposed upon one or more contiguous **Railway Sections**.
  - Fulfills one or more **Maintenance Jobs** (enabling integrated multi-departmental blocks).
  - Utilizes assigned **Crews** and plant/machinery.
  - Intersects with and potentially regulates, diverts, or halts scheduled **Train Movements**.

---

## 3. Summary of Inter-Entity Relationships

| From Entity | Relationship | To Entity | Description |
| :--- | :--- | :--- | :--- |
| **Railway Section** | bounded by | **Station** | Defined between two adjacent stations or junctions |
| **Asset** | located on / in | **Railway Section / Station** | Physical equipment situated on track, OHE, or yard |
| **Asset** | managed by | **Department** | Assigned to Engineering, TRD, or S&T |
| **Maintenance Job** | targets | **Asset** | Specifies work needed on physical infrastructure |
| **Maintenance Job** | submitted by | **Department** | Requested by the responsible technical branch |
| **Maintenance Block** | reserves | **Railway Section** | Temporarily halts traffic/power on the section |
| **Maintenance Block** | satisfies | **Maintenance Job(s)** | Allocates physical time to execute the job(s) |
| **Maintenance Block** | staffed by | **Crew** | Mobilizes necessary personnel and machinery |
| **Train Movement** | occupies | **Railway Section** | Traverses section within a timetabled time window |
| **Train Movement** | belongs to | **Train** | Specific instance of a scheduled train service |
