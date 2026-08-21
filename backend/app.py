# =============================================================
#  AI-Driven IoT Smart Patient Monitor — Flask Backend
#  File: app.py
# =============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, os, json
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Allow dashboard to fetch data cross-origin

DB_PATH = os.path.join(os.path.dirname(__file__), "vitals.db")

# =============================================================
#  DATABASE INITIALISATION
# =============================================================
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS vitals (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp   TEXT    NOT NULL,
                heart_rate  INTEGER NOT NULL,
                spo2        REAL    NOT NULL,
                status      TEXT    NOT NULL,
                created_at  TEXT    DEFAULT (datetime('now'))
            )
        """)
        conn.commit()
    print("[DB] Database ready →", DB_PATH)

# =============================================================
#  HELPER: get db connection
# =============================================================
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# =============================================================
#  HELPER: validate incoming payload
# =============================================================
def validate_payload(data):
    required = ["timestamp", "heart_rate", "spo2", "status"]
    for field in required:
        if field not in data:
            return False, f"Missing field: {field}"

    if not isinstance(data["heart_rate"], (int, float)):
        return False, "heart_rate must be numeric"
    if not isinstance(data["spo2"], (int, float)):
        return False, "spo2 must be numeric"
    if data["status"] not in ("NORMAL", "CRITICAL"):
        return False, "status must be NORMAL or CRITICAL"
    if data["heart_rate"] < 0 or data["heart_rate"] > 300:
        return False, "heart_rate out of physiological range"
    if data["spo2"] < 0 or data["spo2"] > 100:
        return False, "spo2 out of range"

    return True, None

# =============================================================
#  POST /api/vitals  — receive reading from NodeMCU
# =============================================================
@app.route("/api/vitals", methods=["POST"])
def post_vitals():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    valid, err = validate_payload(data)
    if not valid:
        return jsonify({"error": err}), 422

    with get_db() as conn:
        conn.execute(
            "INSERT INTO vitals (timestamp, heart_rate, spo2, status) VALUES (?,?,?,?)",
            (data["timestamp"], int(data["heart_rate"]),
             float(data["spo2"]), data["status"])
        )
        conn.commit()

    return jsonify({"message": "OK"}), 201

# =============================================================
#  GET /api/vitals/latest  — most recent reading
# =============================================================
@app.route("/api/vitals/latest", methods=["GET"])
def get_latest():
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM vitals ORDER BY id DESC LIMIT 1"
        ).fetchone()

    if not row:
        return jsonify({"message": "No data yet"}), 204

    return jsonify(dict(row))

# =============================================================
#  GET /api/vitals/history?range=1h|24h
# =============================================================
@app.route("/api/vitals/history", methods=["GET"])
def get_history():
    range_param = request.args.get("range", "1h")

    if range_param == "24h":
        cutoff = datetime.utcnow() - timedelta(hours=24)
    else:
        cutoff = datetime.utcnow() - timedelta(hours=1)

    cutoff_str = cutoff.strftime("%Y-%m-%d %H:%M:%S")

    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM vitals WHERE created_at >= ? ORDER BY id ASC",
            (cutoff_str,)
        ).fetchall()

    return jsonify([dict(r) for r in rows])

# =============================================================
#  GET /api/alerts  — all CRITICAL events
# =============================================================
@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM vitals WHERE status='CRITICAL' ORDER BY id DESC"
        ).fetchall()

    return jsonify([dict(r) for r in rows])

# =============================================================
#  Health check
# =============================================================
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})

# =============================================================
#  ENTRY POINT
# =============================================================
if __name__ == "__main__":
    init_db()
    print("[SERVER] Starting Flask backend on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
