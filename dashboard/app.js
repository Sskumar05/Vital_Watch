// =============================================================
//  VitalWatch — Premium Dashboard JavaScript
//  Features: ECG Canvas | SVG Gauges | BPM Heartbeat Sync
//            Session Stats | Live Feed | Smooth Counter | Dark Mode
// =============================================================

// ── Config ────────────────────────────────────────────────────
const BACKEND_BASE  = "http://localhost:5000";
const POLL_INTERVAL = 3000;   // ms
const CHART_MAX_PTS = 80;
const CIRCUMFERENCE = 402.1;  // 2π × 64 (SVG radius)
const FEED_MAX      = 12;     // max feed items

// ── ECG Engine ───────────────────────────────────────────────
const ECG_CYCLE = generateECGCycle(320);
let   ecgPhase  = 0;
let   ecgStatus = "NORMAL";
let   ecgAnimId = null;
let   ecgCtx    = null;
let   ecgW      = 0;
let   ecgH      = 0;

// ── Smooth Counter (lerp) ─────────────────────────────────────
let displayHR   = 0;
let displaySpO2 = 0;
let targetHR    = 0;
let targetSpO2  = 0;
let lerpAnimId  = null;

// ── Session Stats ─────────────────────────────────────────────
const stats = { hrMin: Infinity, hrMax: -Infinity, hrSum: 0,
                spo2Min: Infinity, spo2Sum: 0, count: 0, alerts: 0 };

// ── State ─────────────────────────────────────────────────────
let chart        = null;
let currentRange = "1h";
let alertData    = [];
let feedEvents   = [];
let isDark       = localStorage.getItem("vw-dark") === "true";

// ── DOM Refs ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// =============================================================
//  ECG — Generate realistic PQRST waveform cycle
// =============================================================
function generateECGCycle(N) {
  const g = (t, mu, sigma) => Math.exp(-0.5 * ((t - mu) / sigma) ** 2);
  const pts = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / N;
    let y = 0;
    y += g(t, 0.10, 0.014) * 0.18;   // P wave
    y -= g(t, 0.27, 0.007) * 0.13;   // Q dip
    y += g(t, 0.32, 0.013) * 1.00;   // R spike
    y -= g(t, 0.38, 0.009) * 0.24;   // S dip
    y += g(t, 0.56, 0.046) * 0.30;   // T wave
    pts[i] = y;
  }
  return pts;
}

// =============================================================
//  ECG — Setup canvas with DPR
// =============================================================
function setupECGCanvas() {
  const canvas = $("ecg-canvas");
  if (!canvas) return;
  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  ecgW = rect.width;
  ecgH = rect.height;
  canvas.width  = ecgW  * dpr;
  canvas.height = ecgH  * dpr;
  ecgCtx = canvas.getContext("2d");
  ecgCtx.scale(dpr, dpr);
}

// =============================================================
//  ECG — Draw one frame
// =============================================================
function drawECGFrame() {
  if (!ecgCtx) return;

  const W = ecgW, H = ecgH;
  const isNight = isDark;
  const isCritical = ecgStatus === "CRITICAL";

  // Background
  ecgCtx.fillStyle = "#050e1a";
  ecgCtx.fillRect(0, 0, W, H);

  // Grid lines
  const gridColor = "rgba(0,255,100,0.05)";
  ecgCtx.strokeStyle = gridColor;
  ecgCtx.lineWidth = 0.5;
  const gridX = 40, gridY = 30;
  for (let x = 0; x < W; x += gridX) {
    ecgCtx.beginPath(); ecgCtx.moveTo(x, 0); ecgCtx.lineTo(x, H); ecgCtx.stroke();
  }
  for (let y = 0; y < H; y += gridY) {
    ecgCtx.beginPath(); ecgCtx.moveTo(0, y); ecgCtx.lineTo(W, y); ecgCtx.stroke();
  }
  // Center baseline
  ecgCtx.strokeStyle = "rgba(0,255,100,0.09)";
  ecgCtx.lineWidth = 1;
  ecgCtx.beginPath(); ecgCtx.moveTo(0, H * 0.5); ecgCtx.lineTo(W, H * 0.5); ecgCtx.stroke();

  // Waveform
  const lineColor   = isCritical ? "#ff4040" : "#00ff88";
  const glowColor   = isCritical ? "rgba(255,64,64,0.6)" : "rgba(0,255,136,0.5)";
  const amplitude   = H * 0.34;
  const midY        = H * 0.5;
  const N           = ECG_CYCLE.length;

  // Glow pass
  ecgCtx.beginPath();
  ecgCtx.strokeStyle = glowColor;
  ecgCtx.lineWidth   = 5;
  ecgCtx.shadowColor = glowColor;
  ecgCtx.shadowBlur  = 14;
  for (let x = 0; x < W; x++) {
    const phase = Math.floor((ecgPhase + x * 1.4) % N);
    const y = midY - ECG_CYCLE[phase] * amplitude;
    x === 0 ? ecgCtx.moveTo(x, y) : ecgCtx.lineTo(x, y);
  }
  ecgCtx.stroke();

  // Crisp pass
  ecgCtx.beginPath();
  ecgCtx.strokeStyle = lineColor;
  ecgCtx.lineWidth   = 2;
  ecgCtx.shadowBlur  = 0;
  for (let x = 0; x < W; x++) {
    const phase = Math.floor((ecgPhase + x * 1.4) % N);
    const y = midY - ECG_CYCLE[phase] * amplitude;
    x === 0 ? ecgCtx.moveTo(x, y) : ecgCtx.lineTo(x, y);
  }
  ecgCtx.stroke();

  // Scanning dot at right edge
  const scanPhase = Math.floor((ecgPhase + (W - 1) * 1.4) % N);
  const scanY     = midY - ECG_CYCLE[scanPhase] * amplitude;
  ecgCtx.beginPath();
  ecgCtx.arc(W - 1, scanY, 4, 0, Math.PI * 2);
  ecgCtx.fillStyle = lineColor;
  ecgCtx.shadowColor = glowColor;
  ecgCtx.shadowBlur  = 10;
  ecgCtx.fill();

  // Advance phase (speed: ~2 pts/frame → looks like ~75 BPM scroll)
  ecgPhase = (ecgPhase + 1.8) % N;
  ecgAnimId = requestAnimationFrame(drawECGFrame);
}

function startECG() {
  setupECGCanvas();
  if (ecgAnimId) cancelAnimationFrame(ecgAnimId);
  ecgAnimId = requestAnimationFrame(drawECGFrame);
}

// =============================================================
//  SVG GAUGE — Update arc dashoffset smoothly
// =============================================================
function setGauge(arcId, fraction) {
  const arc = $(arcId);
  if (!arc) return;
  const f = Math.max(0, Math.min(1, fraction));
  arc.style.strokeDashoffset = CIRCUMFERENCE * (1 - f);
}

// =============================================================
//  SMOOTH NUMBER COUNTER (lerp animation)
// =============================================================
function startLerp() {
  if (lerpAnimId) cancelAnimationFrame(lerpAnimId);
  function tick() {
    let changed = false;
    const SPEED = 0.12;

    if (Math.abs(targetHR - displayHR) > 0.3) {
      displayHR += (targetHR - displayHR) * SPEED;
      changed = true;
    } else {
      displayHR = targetHR;
    }

    if (Math.abs(targetSpO2 - displaySpO2) > 0.05) {
      displaySpO2 += (targetSpO2 - displaySpO2) * SPEED;
      changed = true;
    } else {
      displaySpO2 = targetSpO2;
    }

    if (changed) {
      const hrEl   = $("hr-num");
      const spo2El = $("spo2-num");
      if (hrEl)   hrEl.textContent   = Math.round(displayHR);
      if (spo2El) spo2El.textContent = displaySpO2.toFixed(1);
      lerpAnimId = requestAnimationFrame(tick);
    }
  }
  lerpAnimId = requestAnimationFrame(tick);
}

// =============================================================
//  SYNC HEARTBEAT to actual BPM
// =============================================================
function syncHeartbeat(bpm) {
  const duration = Math.max(400, Math.min(2000, 60000 / bpm));
  const el = $("logo-heart-card");
  const logo = $("logo-heart");
  if (el)   el.style.animationDuration   = duration + "ms";
  if (logo) logo.style.animationDuration = duration + "ms";

  // ECG BPM badge
  const badge = $("ecg-bpm");
  if (badge) badge.textContent = `${Math.round(bpm)} bpm`;
}

// =============================================================
//  UPDATE ALL CARDS
// =============================================================
function updateCards(hr, spo2, status) {
  targetHR   = hr;
  targetSpO2 = spo2;
  ecgStatus  = status;
  startLerp();
  syncHeartbeat(hr);

  // Gauge fractions
  const hrFrac   = (hr - 30)   / (180 - 30);      // 30–180 range
  const spo2Frac = (spo2 - 70) / (100 - 70);      // 70–100 range
  setGauge("hr-arc",   hrFrac);
  setGauge("spo2-arc", spo2Frac);

  const isCritical = status === "CRITICAL";

  // Cards
  const hrCard   = $("card-hr");
  const spo2Card = $("card-spo2");
  hrCard.classList.toggle("card-critical", isCritical);
  hrCard.classList.toggle("card-normal",   !isCritical);
  spo2Card.classList.toggle("card-critical", isCritical);
  spo2Card.classList.toggle("card-normal",   !isCritical);

  // Number colors
  const hrNum   = $("hr-num");
  const spo2Num = $("spo2-num");
  if (hrNum)   { hrNum.classList.toggle("num-critical", isCritical);   hrNum.classList.toggle("num-normal", !isCritical); }
  if (spo2Num) { spo2Num.classList.toggle("num-critical", isCritical); spo2Num.classList.toggle("num-normal", !isCritical); }

  // Badges
  setBadge("hr-badge",   status);
  setBadge("spo2-badge", status);

  // Breathing ring speed
  const ring = $("breathing-ring");
  if (ring) ring.style.animationDuration = isCritical ? "1.5s" : "4s";
}

function setBadge(id, status) {
  const el = $(id);
  if (!el) return;
  el.className = "status-pill";
  if (status === "CRITICAL") { el.classList.add("pill-critical"); el.textContent = "● CRITICAL"; }
  else                        { el.classList.add("pill-normal");   el.textContent = "● NORMAL"; }
}

// =============================================================
//  SESSION STATS
// =============================================================
function updateStats(hr, spo2, status) {
  stats.hrMin   = Math.min(stats.hrMin, hr);
  stats.hrMax   = Math.max(stats.hrMax, hr);
  stats.hrSum  += hr;
  stats.spo2Min = Math.min(stats.spo2Min, spo2);
  stats.spo2Sum += spo2;
  stats.count  += 1;
  if (status === "CRITICAL") stats.alerts++;

  const hrAvg   = stats.hrSum   / stats.count;
  const spo2Avg = stats.spo2Sum / stats.count;

  setStatVal("stat-hr-min",   stats.hrMin + " bpm");
  setStatVal("stat-hr-max",   stats.hrMax + " bpm");
  setStatVal("stat-hr-avg",   Math.round(hrAvg) + " bpm");
  setStatVal("stat-spo2-min", stats.spo2Min.toFixed(1) + "%");
  setStatVal("stat-spo2-avg", spo2Avg.toFixed(1) + "%");
  setStatVal("stat-alerts",   stats.alerts);
  setStatVal("stat-readings", stats.count);
}

function setStatVal(id, val) {
  const el = $(id);
  if (el && el.textContent !== String(val)) {
    el.textContent = val;
    el.animate([{ transform: "scale(1.15)", color: "var(--clr-primary)" },
                { transform: "scale(1)",    color: "var(--clr-text)" }], 350);
  }
}

// =============================================================
//  LIVE STATUS FEED
// =============================================================
function addFeedEvent(hr, spo2, status, timestamp) {
  feedEvents.unshift({ hr, spo2, status, timestamp });
  if (feedEvents.length > FEED_MAX) feedEvents.pop();

  const feed = $("status-feed");
  if (!feed) return;

  feed.innerHTML = feedEvents.map(e => `
    <div class="feed-item fi-${e.status.toLowerCase()}">
      <div class="fi-dot fi-dot-${e.status.toLowerCase()}"></div>
      <div class="fi-data">
        HR <strong>${e.hr} bpm</strong> <span>·</span> SpO2 <strong>${e.spo2}%</strong>
      </div>
      <span class="fi-time">${e.timestamp}</span>
    </div>
  `).join("");

  const countEl = $("feed-count");
  if (countEl) countEl.textContent = `${stats.count} readings`;
}

// =============================================================
//  ALERT BANNER
// =============================================================
function showAlertBanner(row) {
  const banner = $("alert-banner");
  const detail = $("alert-detail");
  const time   = $("alert-time");
  if (!banner) return;
  detail.textContent = `HR: ${row.heart_rate} bpm  |  SpO2: ${row.spo2}%`;
  time.textContent   = row.timestamp;
  banner.classList.remove("hidden");
}

function hideAlertBanner() {
  const b = $("alert-banner");
  if (b) b.classList.add("hidden");
}

// =============================================================
//  ALERTS TABLE
// =============================================================
function renderAlertsTable(alerts) {
  alertData = alerts || [];
  const body = $("alerts-body");
  if (!body) return;
  if (!alertData.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="4">No critical events recorded yet</td></tr>`;
    return;
  }
  body.innerHTML = alertData.map(a => `
    <tr>
      <td style="font-family:monospace;font-size:.78rem">${a.timestamp}</td>
      <td><strong>${a.heart_rate}</strong> <span style="color:var(--clr-text-muted);font-size:.75rem">bpm</span></td>
      <td><strong>${a.spo2}</strong><span style="color:var(--clr-text-muted);font-size:.75rem">%</span></td>
      <td><span class="tag-critical">CRITICAL</span></td>
    </tr>
  `).join("");
}

// =============================================================
//  CHART
// =============================================================
function initChart() {
  const ctx = $("vitalsChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Heart Rate (bpm)",
          data: [], yAxisID: "y",
          borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)",
          borderWidth: 2.5, pointRadius: 2.5, pointHoverRadius: 5,
          tension: 0.45, fill: true
        },
        {
          label: "SpO2 (%)",
          data: [], yAxisID: "y1",
          borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.08)",
          borderWidth: 2.5, pointRadius: 2.5, pointHoverRadius: 5,
          tension: 0.45, fill: true
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 350 },
      plugins: {
        legend: {
          position: "top",
          labels: { usePointStyle: true, pointStyle: "circle",
                    font: { family: "Inter", size: 12 }, color: "#64748b", padding: 16 }
        },
        tooltip: {
          backgroundColor: "#0f172a", titleFont: { family: "Inter", size: 12 },
          bodyFont: { family: "Inter", size: 13 }, padding: 12, cornerRadius: 10,
          callbacks: {
            label: ctx => ctx.dataset.label + ": " + ctx.parsed.y.toFixed(1)
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(100,116,139,0.1)" },
          ticks: { font: { family: "Inter", size: 10 }, color: "#94a3b8",
                   maxTicksLimit: 8, maxRotation: 0 }
        },
        y: {
          type: "linear", position: "left", min: 30, max: 160,
          title: { display: true, text: "HR (bpm)", color: "#ef4444",
                   font: { family: "Inter", size: 11 } },
          grid: { color: "rgba(239,68,68,0.08)" },
          ticks: { font: { family: "Inter", size: 10 }, color: "#94a3b8" }
        },
        y1: {
          type: "linear", position: "right", min: 80, max: 100,
          title: { display: true, text: "SpO2 (%)", color: "#3b82f6",
                   font: { family: "Inter", size: 11 } },
          grid: { drawOnChartArea: false },
          ticks: { font: { family: "Inter", size: 10 }, color: "#94a3b8" }
        }
      }
    }
  });
}

function updateChart(history) {
  const empty = $("chart-empty");
  if (!history || history.length === 0) {
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");
  const slice = history.slice(-CHART_MAX_PTS);
  chart.data.labels            = slice.map(r => r.timestamp);
  chart.data.datasets[0].data  = slice.map(r => r.heart_rate);
  chart.data.datasets[1].data  = slice.map(r => r.spo2);
  chart.update("none");
}

// =============================================================
//  RANGE TOGGLE
// =============================================================
function setRange(range) {
  currentRange = range;
  $("btn-1h").classList.toggle("active",  range === "1h");
  $("btn-24h").classList.toggle("active", range === "24h");
  pollData();
}

// =============================================================
//  CONNECTION STATUS
// =============================================================
function setOnline() {
  const s = $("conn-status"), l = $("conn-label");
  if (s) s.className = "conn-pill online";
  if (l) l.textContent = "Live";
}
function setOffline() {
  const s = $("conn-status"), l = $("conn-label");
  if (s) s.className = "conn-pill offline";
  if (l) l.textContent = "Offline";
}

// =============================================================
//  DARK MODE
// =============================================================
function applyDark() {
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  const icon = $("dark-toggle");
  if (icon) icon.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("vw-dark", isDark);
}

function toggleDarkMode() {
  isDark = !isDark;
  applyDark();
}

// =============================================================
//  CLOCK
// =============================================================
function updateClock() {
  const el = $("datetime");
  if (el) el.textContent = new Date().toLocaleString("en-IN", {
    weekday: "short", day: "2-digit", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

// =============================================================
//  CSV EXPORT
// =============================================================
function exportCSV() {
  if (!alertData.length) { alert("No alert data to export."); return; }
  const header = "Timestamp,Heart Rate (bpm),SpO2 (%),Status\n";
  const rows   = alertData.map(a =>
    `"${a.timestamp}",${a.heart_rate},${a.spo2},"${a.status}"`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `alerts_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// =============================================================
//  FETCH HELPERS
// =============================================================
async function fetchLatest() {
  const r = await fetch(`${BACKEND_BASE}/api/vitals/latest`);
  if (r.status === 204) return null;
  if (!r.ok) throw new Error("latest");
  return r.json();
}
async function fetchHistory(range) {
  const r = await fetch(`${BACKEND_BASE}/api/vitals/history?range=${range}`);
  if (!r.ok) throw new Error("history");
  return r.json();
}
async function fetchAlerts() {
  const r = await fetch(`${BACKEND_BASE}/api/alerts`);
  if (!r.ok) throw new Error("alerts");
  return r.json();
}

// =============================================================
//  MAIN POLL CYCLE
// =============================================================
async function pollData() {
  try {
    const [latest, history, alerts] = await Promise.all([
      fetchLatest(),
      fetchHistory(currentRange),
      fetchAlerts()
    ]);

    setOnline();
    const lu = $("last-updated");
    if (lu) lu.textContent = new Date().toLocaleTimeString("en-IN");

    if (latest) {
      updateCards(latest.heart_rate, latest.spo2, latest.status);
      updateStats(latest.heart_rate, latest.spo2, latest.status);
      addFeedEvent(latest.heart_rate, latest.spo2, latest.status, latest.timestamp);

      if (latest.status === "CRITICAL") showAlertBanner(latest);
      else                              hideAlertBanner();
    }

    updateChart(history);
    renderAlertsTable(alerts);

  } catch (err) {
    console.warn("[Poll] Backend unreachable:", err.message);
    setOffline();
  }
}

// =============================================================
//  INIT
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  // Dark mode
  applyDark();

  // Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Chart
  initChart();

  // ECG Canvas
  startECG();
  window.addEventListener("resize", () => {
    setupECGCanvas();
  });

  // Start polling
  pollData();
  setInterval(pollData, POLL_INTERVAL);
});
