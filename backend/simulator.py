# =============================================================
#  Smart Patient Monitor — Dummy Data Simulator
#  Mimics the NodeMCU ESP8266 sending vitals every 2 seconds
#  Run ALONGSIDE app.py to test the dashboard without hardware
# =============================================================

import requests
import random
import time
import math
from datetime import datetime

BACKEND_URL  = "http://localhost:5000/api/vitals"
INTERVAL_SEC = 2     # seconds between readings (matches firmware)

# ── Thresholds (must match firmware) ─────────────────────────
HR_HIGH   = 100
HR_LOW    = 50
SPO2_LOW  = 92.0

# ── Scenario modes ────────────────────────────────────────────
# The simulator cycles through realistic physiological scenarios
SCENARIOS = [
    {"name": "Resting Normal",    "duration": 30, "hr_base": 72,  "spo2_base": 98.0, "crisis": False},
    {"name": "Slightly Elevated", "duration": 20, "hr_base": 88,  "spo2_base": 97.5, "crisis": False},
    {"name": "Exercise Recovery", "duration": 20, "hr_base": 105, "spo2_base": 96.5, "crisis": True },
    {"name": "Low SpO2 Alert",    "duration": 15, "hr_base": 78,  "spo2_base": 89.0, "crisis": True },
    {"name": "Bradycardia Alert", "duration": 15, "hr_base": 44,  "spo2_base": 97.0, "crisis": True },
    {"name": "Back to Normal",    "duration": 30, "hr_base": 68,  "spo2_base": 98.5, "crisis": False},
]

def get_timestamp():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def simulate_reading(step, scenario):
    """Generate a physiologically-plausible reading with noise + sinusoidal drift."""
    t = step * INTERVAL_SEC

    # Sinusoidal HR variation (breathing / HRV)
    hr_drift = 3.0 * math.sin(t / 8.0) + 1.5 * math.sin(t / 3.3)
    hr_noise = random.gauss(0, 1.2)
    hr = scenario["hr_base"] + hr_drift + hr_noise
    hr = clamp(round(hr), 25, 200)

    # SpO2 variation (slower)
    spo2_drift = 0.4 * math.sin(t / 12.0)
    spo2_noise = random.gauss(0, 0.3)
    spo2 = scenario["spo2_base"] + spo2_drift + spo2_noise
    spo2 = clamp(round(spo2, 1), 70.0, 100.0)

    # Determine status
    if hr > HR_HIGH or hr < HR_LOW or spo2 < SPO2_LOW:
        status = "CRITICAL"
    else:
        status = "NORMAL"

    return {
        "timestamp": get_timestamp(),
        "heart_rate": int(hr),
        "spo2": float(spo2),
        "status": status
    }

def send_reading(payload):
    try:
        r = requests.post(BACKEND_URL, json=payload, timeout=3)
        return r.status_code
    except requests.exceptions.ConnectionError:
        return None

def print_row(scenario_name, payload, http_code):
    status_color = "\033[91m" if payload["status"] == "CRITICAL" else "\033[92m"
    reset        = "\033[0m"
    code_str     = str(http_code) if http_code else "CONN ERR"
    print(
        f"[{payload['timestamp']}]  "
        f"Scenario: {scenario_name:<22}  "
        f"HR: {payload['heart_rate']:>3} bpm  "
        f"SpO2: {payload['spo2']:>5.1f}%  "
        f"{status_color}{payload['status']:<8}{reset}  "
        f"HTTP {code_str}"
    )

# =============================================================
#  MAIN
# =============================================================
def main():
    print("=" * 70)
    print("  Smart Patient Monitor — Dummy Data Simulator")
    print(f"  Posting to: {BACKEND_URL}")
    print(f"  Interval  : {INTERVAL_SEC}s")
    print("  Press Ctrl+C to stop")
    print("=" * 70)
    print()

    # Wait for backend to be ready
    print("[SIM] Checking backend connection...")
    for attempt in range(10):
        try:
            r = requests.get("http://localhost:5000/health", timeout=2)
            if r.status_code == 200:
                print(f"[SIM] Backend is UP ✓\n")
                break
        except Exception:
            pass
        print(f"[SIM] Waiting for Flask backend... attempt {attempt+1}/10")
        time.sleep(2)
    else:
        print("[SIM] ⚠ Backend not responding. Make sure 'python app.py' is running.")
        print("[SIM] Starting simulator anyway — readings will retry...\n")

    step = 0
    scenario_idx = 0
    scenario_step = 0

    try:
        while True:
            scenario = SCENARIOS[scenario_idx]

            payload    = simulate_reading(step, scenario)
            http_code  = send_reading(payload)
            print_row(scenario["name"], payload, http_code)

            step          += 1
            scenario_step += 1

            # Advance to next scenario after its duration
            readings_in_scenario = int(scenario["duration"] / INTERVAL_SEC)
            if scenario_step >= readings_in_scenario:
                scenario_step = 0
                scenario_idx  = (scenario_idx + 1) % len(SCENARIOS)
                print(f"\n[SIM] ── Switching to: {SCENARIOS[scenario_idx]['name']} ──\n")

            time.sleep(INTERVAL_SEC)

    except KeyboardInterrupt:
        print("\n[SIM] Simulator stopped.")

if __name__ == "__main__":
    main()
