# AI-Driven IoT Smart Remote Patient Monitoring System (MERN Stack Edition)

A full-stack Wi-Fi patient monitoring system built with **NodeMCU ESP8266**, **MAX30102 pulse oximeter**, an **Express.js & Node.js REST API**, **MongoDB database (Mongoose ODM)**, and a **real-time React.js dashboard**.

---

## 📁 Project Architecture & Structure

```
MADHUSRI/
├── frontend/                                   ← React.js Application (Vite)
│   ├── src/
│   │   ├── components/                         ← Modular UI Components
│   │   │   ├── Header.jsx                      ← Header, logo, live clock, status pill, dark toggle
│   │   │   ├── AlertBanner.jsx                 ← Critical vitals alert banner with pulse rings
│   │   │   ├── HeartRateCard.jsx               ← SVG gauge, animated heartbeat, status badge
│   │   │   ├── SpO2Card.jsx                    ← SVG gauge, breathing ring, status badge
│   │   │   ├── ECGCanvas.jsx                   ← Procedural PQRST canvas waveform with glow pass
│   │   │   ├── SessionStats.jsx                ← Running Min/Max/Avg stats chips
│   │   │   ├── VitalsTrendChart.jsx            ← Dual-axis Chart.js trend chart (1h / 24h)
│   │   │   ├── StatusFeed.jsx                  ← Live scrolling event stream
│   │   │   ├── AlertsTable.jsx                 ← Critical events history & CSV export
│   │   │   └── Footer.jsx                      ← Footer with last updated timestamp
│   │   ├── services/
│   │   │   └── api.js                          ← API communication service (fetch)
│   │   ├── hooks/
│   │   │   └── useVitalsPoll.js                ← 3-second polling hook & stats aggregator
│   │   ├── utils/
│   │   │   ├── ecgEngine.js                    ← Gaussian PQRST wave synthesis algorithm
│   │   │   └── csvExport.js                    ← CSV generator for alert records
│   │   ├── styles/
│   │   │   └── dashboard.css                   ← Preserved design tokens, themes & keyframes
│   │   ├── App.jsx                             ← Main React application layout
│   │   └── main.jsx                            ← React DOM mount point
│   ├── index.html                              ← HTML5 template with Inter font
│   ├── vite.config.js                          ← Vite bundler configuration & API proxy
│   └── package.json                            ← Frontend dependencies
│
├── backend/                                    ← Express.js / Node.js Backend
│   ├── config/
│   │   └── db.js                               ← MongoDB connection manager (Mongoose)
│   ├── models/
│   │   └── Vital.js                            ← Vital schema & auto-increment ID hook
│   ├── controllers/
│   │   └── vitalsController.js                 ← Request handlers matching Flask logic
│   ├── routes/
│   │   └── vitalsRoutes.js                     ← REST routes (/api/vitals, /api/alerts)
│   ├── middleware/
│   │   ├── validator.js                        ← Strict physiological & schema validator
│   │   └── errorHandler.js                     ← Centralized JSON error handler
│   ├── services/
│   │   └── vitalsService.js                    ← MongoDB query layer
│   ├── server.js                               ← Express server entry point (Port 5000)
│   ├── simulator.js                            ← Node.js dummy data generator
│   ├── testApiEndpoints.js                     ← Automated API regression test suite
│   ├── package.json                            ← Backend dependencies
│   ├── app.py                                  ← Original Flask backend (preserved)
│   ├── simulator.py                            ← Original Python simulator (preserved)
│   ├── requirements.txt                        ← Original Python dependencies (preserved)
│   └── vitals.db                               ← Original SQLite database (preserved)
│
├── database-migration/                         ← SQLite to MongoDB Migration Utility
│   ├── migrateSQLiteToMongoDB.js               ← Safe, idempotent data migration script
│   ├── verifyMigration.js                      ← Row-by-row data integrity verification
│   ├── testMigrationWithMemoryServer.js        ← In-memory end-to-end migration test
│   └── package.json                            ← Migration dependencies
│
├── firmware/                                   ← Embedded Hardware Layer (Preserved)
│   └── smart_patient_monitor/
│       └── smart_patient_monitor.ino           ← Arduino C++ firmware for NodeMCU ESP8266
│
├── .env.example                                ← Environment variables template
├── START_MERN_DEMO.bat                         ← 1-Click launcher for MERN application
├── START_DEMO.bat                              ← Original launcher (preserved)
└── README.md                                   ← Comprehensive project documentation
```

---

## ⚡ Part A — Hardware Wiring

| MAX30102 Pin | NodeMCU Pin | Notes          |
|--------------|-------------|----------------|
| SDA          | D2 (GPIO4)  | I2C data       |
| SCL          | D1 (GPIO5)  | I2C clock      |
| VIN          | 3.3V        | Do NOT use 5V  |
| GND          | GND         | Ground         |

**Power:** 3.7V Li-ion battery via TP4056 module → NodeMCU VIN.

---

## 🔧 Part B — Firmware Setup (NodeMCU ESP8266)

The firmware is located in `firmware/smart_patient_monitor/smart_patient_monitor.ino`. It sends telemetry directly to the Express backend via HTTP POST.

### 1. Arduino IDE Setup
1. Open Arduino IDE → **File → Preferences**.
2. Add to "Additional Board Manager URLs":
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. Go to **Tools → Board → Board Manager** → search "esp8266" → install **esp8266 by ESP8266 Community**.
4. Select **Tools → Board → NodeMCU 1.0 (ESP-12E Module)**.

### 2. Required Libraries
Install the following via **Sketch → Include Library → Manage Libraries**:
* **SparkFun MAX3010x**
* **Blynk** by Volodymyr Shymanskyy
* **ESP8266WiFi** (bundled with board)
* **ESP8266HTTPClient** (bundled with board)

### 3. Hardware Credentials Configuration
In `smart_patient_monitor.ino`, update:
```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL   = "http://<YOUR-PC-IP>:5000/api/vitals"; // Express backend LAN IP
const char* BLYNK_AUTH    = "YOUR_BLYNK_AUTH_TOKEN";
```

---

## 🚀 Part C — Quick Start (MERN Stack)

### Automated 1-Click Launch (Windows)
Double-click `START_MERN_DEMO.bat`. It will automatically:
1. Verify and install dependencies if needed.
2. Start the Express.js backend on `http://localhost:5000`.
3. Start the patient telemetry simulator posting live biometric readings every 2 seconds.
4. Launch the React.js dashboard in your default browser at `http://localhost:3000`.

---

## 🛠️ Part D — Manual Step-by-Step Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher (v24 LTS recommended)
* **npm**: v9.0.0 or higher
* **MongoDB**: Local Community Server (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to specify your MongoDB connection:
```env
PORT=5000
HOST=0.0.0.0
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/patient_monitor
VITE_API_URL=http://localhost:5000
```

### 2. Migrate Existing SQLite Data to MongoDB
To transfer all 524 historical patient readings from `backend/vitals.db` to MongoDB:
```bash
cd database-migration
node migrateSQLiteToMongoDB.js
```
To verify row-by-row accuracy:
```bash
node verifyMigration.js
```

### 3. Start the Express Backend
```bash
cd backend
npm install
npm start
```
The server will start on `http://localhost:5000`.

### 4. Start the React Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

### 5. Start Telemetry Data Simulator (Testing without Hardware)
In a third terminal window:
```bash
cd backend
node simulator.js
```

---

## 📡 Part E — API Specification

The Express backend strictly replicates the original Flask REST API routes, status codes, and JSON response formats:

| Method | Endpoint | Description | Request Body | Success Status |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/vitals` | Telemetry ingestion from NodeMCU / Simulator | `{ "timestamp": "...", "heart_rate": 78, "spo2": 98.2, "status": "NORMAL" }` | `201 Created` |
| **GET** | `/api/vitals/latest` | Most recent patient reading | None | `200 OK` / `204 No Content` |
| **GET** | `/api/vitals/history?range=1h\|24h` | Historical readings within 1h or 24h cutoff | Query param `range` | `200 OK` (JSON Array) |
| **GET** | `/api/alerts` | List of all CRITICAL events (sorted descending) | None | `200 OK` (JSON Array) |
| **GET** | `/health` | Server health check | None | `200 OK` (`{ "status": "ok", "time": "..." }`) |

### Strict Validation Rules
Payloads submitted to `POST /api/vitals` are subject to the following checks:
* Missing body or non-JSON object $\rightarrow$ `400 Bad Request` (`{"error": "Invalid JSON payload"}`)
* Missing `timestamp`, `heart_rate`, `spo2`, or `status` $\rightarrow$ `422 Unprocessable Entity` (`{"error": "Missing field: <field>"}`)
* Non-numeric `heart_rate` or `spo2` $\rightarrow$ `422 Unprocessable Entity`
* `status` not in `("NORMAL", "CRITICAL")` $\rightarrow$ `422 Unprocessable Entity`
* `heart_rate < 0` or `heart_rate > 300` $\rightarrow$ `422 Unprocessable Entity` (`{"error": "heart_rate out of physiological range"}`)
* `spo2 < 0` or `spo2 > 100` $\rightarrow$ `422 Unprocessable Entity` (`{"error": "spo2 out of range"}`)

---

## 🧪 Part F — Automated Test Suites

The codebase includes two automated test suites:
1. **Migration & Idempotency Pipeline Test:**
   ```bash
   node database-migration/testMigrationWithMemoryServer.js
   ```
   *Spins up an in-memory MongoDB instance, migrates 524 SQLite rows, verifies exact record counts and field values, and reruns migration to verify zero duplicate creation.*

2. **Express API Regression Test Suite:**
   ```bash
   node backend/testApiEndpoints.js
   ```
   *Tests all REST endpoints, validation rules, error codes, and telemetry ingestion against a live test database.*

---

## 📊 Biometric Thresholds

| Metric | Normal Range | CRITICAL Condition |
| :--- | :--- | :--- |
| **Heart Rate** | 50–100 bpm | `< 50` or `> 100 bpm` |
| **SpO2** | $\ge 92.0\%$ | `< 92.0%` |

Alert cooldown on hardware: **60 seconds** (prevents notification spam).

---

## 🛡️ Data Preservation Notice
The original SQLite database ([backend/vitals.db](file:///c:/Users/divya/OneDrive/Desktop/Final%20year_2026/Madhusri_Batch/IOT_DEMO/MADHUSRI/backend/vitals.db)) and original Python scripts are preserved untouched as permanent backups.
