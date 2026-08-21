# AI-Driven IoT Smart Remote Patient Monitoring System

A full-stack Wi-Fi patient monitoring prototype built with **NodeMCU ESP8266**, **MAX30102 pulse oximeter**, a **Flask REST backend**, and a **live web dashboard**.

---

## 📁 Project Structure

```
MADHUSRI/
├── firmware/
│   └── smart_patient_monitor/
│       └── smart_patient_monitor.ino   ← Arduino firmware
├── backend/
│   ├── app.py                          ← Flask REST API
│   ├── requirements.txt
│   └── vitals.db                       ← SQLite (auto-created)
├── dashboard/
│   ├── index.html                      ← Web dashboard
│   ├── style.css
│   └── app.js
└── README.md
```

---

## ⚡ Part A — Hardware Wiring

| MAX30102 Pin | NodeMCU Pin | Notes          |
|--------------|-------------|----------------|
| SDA          | D2 (GPIO4)  | I2C data       |
| SCL          | D1 (GPIO5)  | I2C clock      |
| VIN          | 3.3V        | Do NOT use 5V  |
| GND          | GND         |                |

**Power:** 3.7V Li-ion battery via TP4056 module → NodeMCU VIN

---

## 🔧 Part B — Firmware Setup

### 1. Install Arduino IDE Board Support
1. Open Arduino IDE → **File → Preferences**
2. Add to "Additional Board Manager URLs":
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. Go to **Tools → Board → Board Manager** → search "esp8266" → install **esp8266 by ESP8266 Community**
4. Select **Tools → Board → NodeMCU 1.0 (ESP-12E Module)**

### 2. Install Required Libraries
In Arduino IDE → **Sketch → Include Library → Manage Libraries**, install:

| Library                    | Author        |
|----------------------------|---------------|
| SparkFun MAX3010x          | SparkFun      |
| Blynk                      | Volodymyr Shymanskyy |
| ESP8266WiFi                | (bundled with board) |
| ESP8266HTTPClient          | (bundled with board) |

### 3. Configure Credentials
Open `smart_patient_monitor.ino` and edit the top section:

```cpp
const char* WIFI_SSID    = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL  = "http://<YOUR-PC-IP>:5000/api/vitals";
const char* BLYNK_AUTH   = "YOUR_BLYNK_AUTH_TOKEN";
```

> 💡 Find your PC's local IP: run `ipconfig` on Windows, look for IPv4 address (e.g. `192.168.1.5`)

### 4. Flash to NodeMCU
1. Connect NodeMCU via USB
2. Select correct COM port: **Tools → Port → COMX**
3. Click **Upload (→)**
4. Open **Serial Monitor** at **115200 baud** to see debug output

---

## 🖥️ Part C — Flask Backend Setup

### 1. Prerequisites
- Python 3.8+ installed

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Run the Server
```bash
python app.py
```

Server starts at: `http://0.0.0.0:5000`

### 4. API Endpoints

| Method | Endpoint                        | Description                     |
|--------|---------------------------------|---------------------------------|
| POST   | `/api/vitals`                   | Receive reading from NodeMCU    |
| GET    | `/api/vitals/latest`            | Most recent reading             |
| GET    | `/api/vitals/history?range=1h`  | History (1h or 24h)             |
| GET    | `/api/alerts`                   | All CRITICAL events             |
| GET    | `/health`                       | Server health check             |

**Example POST payload:**
```json
{
  "timestamp": "T+00:01:23",
  "heart_rate": 85,
  "spo2": 97.4,
  "status": "NORMAL"
}
```

---

## 📊 Part D — Dashboard

### Open the Dashboard
Simply open `dashboard/index.html` in any modern browser.

> ⚠️ If the Flask server is running on a different machine, update `BACKEND_BASE` at the top of `app.js`:
> ```js
> const BACKEND_BASE = "http://192.168.1.100:5000";
> ```

### Dashboard Features
- 🔴 **Live HR card** — updates every 3 seconds
- 🔵 **SpO2 card** with progress bar
- 📈 **Trend chart** — 1h / 24h toggle (Chart.js dual-axis)
- ⚠️ **Alert banner** — fades in when status = CRITICAL
- 📋 **Alert history table** — all critical events
- ⬇️ **Export CSV** button
- 🕐 **Live clock** + connection status indicator

---

## 📱 Blynk Setup (Backup Alert Channel)

1. Download **Blynk IoT** app (iOS / Android)
2. Create a new Template → add Datastreams:
   - V0: Integer → Heart Rate
   - V1: Double → SpO2
   - V2: String → Status
3. Add an **Event** named `critical_alert`
4. Copy the **Auth Token** → paste into `BLYNK_AUTH` in firmware
5. Enable push notifications in the Blynk app

---

## 🔍 Troubleshooting

| Problem                        | Solution                                                             |
|--------------------------------|----------------------------------------------------------------------|
| Sensor not found               | Check I2C wiring (SDA→D2, SCL→D1), ensure 3.3V power               |
| Serial shows "waiting for finger" | Place finger firmly, cover sensor completely                    |
| Wi-Fi not connecting           | Verify SSID/password, ensure 2.4 GHz band (not 5 GHz)              |
| Backend not receiving data     | Confirm `BACKEND_URL` uses PC's LAN IP, not `localhost`             |
| No data on dashboard           | Check browser console for CORS errors; ensure Flask is running      |
| Chart empty                    | Wait for data — history endpoint returns empty until readings arrive |
| Blynk not alerting             | Verify Auth Token, check Blynk server connection in Serial Monitor  |

---

## 📋 Thresholds

| Metric     | Normal Range | CRITICAL Condition  |
|------------|--------------|---------------------|
| Heart Rate | 50–100 bpm   | < 50 or > 100 bpm   |
| SpO2       | ≥ 92%        | < 92%               |

Alert cooldown: **60 seconds** (prevents notification spam)

---

## 🔮 Future Enhancements
- NTP time sync for real timestamps
- ECG (AD8232) sensor integration
- ML-based anomaly detection (TensorFlow Lite on device)
- Mobile app (Flutter)
- HTTPS / authentication

---

*Built for academic prototype demonstration. Not for clinical/medical use.*
