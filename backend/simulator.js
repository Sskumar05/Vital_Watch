// =============================================================
//  Smart Patient Monitor — Node.js Dummy Data Simulator
//  Matches simulator.py exactly: mimics NodeMCU ESP8266 sending vitals
// =============================================================

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api/vitals';
const INTERVAL_SEC = 2; // seconds between readings

const HR_HIGH = 100;
const HR_LOW = 50;
const SPO2_LOW = 92.0;

const SCENARIOS = [
  { name: 'Resting Normal', duration: 30, hr_base: 72, spo2_base: 98.0, crisis: false },
  { name: 'Slightly Elevated', duration: 20, hr_base: 88, spo2_base: 97.5, crisis: false },
  { name: 'Exercise Recovery', duration: 20, hr_base: 105, spo2_base: 96.5, crisis: true },
  { name: 'Low SpO2 Alert', duration: 15, hr_base: 78, spo2_base: 89.0, crisis: true },
  { name: 'Bradycardia Alert', duration: 15, hr_base: 44, spo2_base: 97.0, crisis: true },
  { name: 'Back to Normal', duration: 30, hr_base: 68, spo2_base: 98.5, crisis: false },
];

function getTimestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function gaussianRandom(mean = 0, stdev = 1) {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

function simulateReading(step, scenario) {
  const t = step * INTERVAL_SEC;

  // Sinusoidal HR variation
  const hrDrift = 3.0 * Math.sin(t / 8.0) + 1.5 * Math.sin(t / 3.3);
  const hrNoise = gaussianRandom(0, 1.2);
  let hr = scenario.hr_base + hrDrift + hrNoise;
  hr = clamp(Math.round(hr), 25, 200);

  // SpO2 variation
  const spo2Drift = 0.4 * Math.sin(t / 12.0);
  const spo2Noise = gaussianRandom(0, 0.3);
  let spo2 = scenario.spo2_base + spo2Drift + spo2Noise;
  spo2 = clamp(parseFloat(spo2.toFixed(1)), 70.0, 100.0);

  // Status check
  const status = hr > HR_HIGH || hr < HR_LOW || spo2 < SPO2_LOW ? 'CRITICAL' : 'NORMAL';

  return {
    timestamp: getTimestamp(),
    heart_rate: hr,
    spo2: spo2,
    status: status,
  };
}

async function sendReading(payload) {
  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.status;
  } catch (err) {
    return null;
  }
}

function printRow(scenarioName, payload, httpCode) {
  const codeStr = httpCode ? `HTTP ${httpCode}` : 'CONN ERR';
  const statusColor = payload.status === 'CRITICAL' ? '\x1b[91m' : '\x1b[92m';
  const reset = '\x1b[0m';
  console.log(
    `[${payload.timestamp}]  Scenario: ${scenarioName.padEnd(20)}  HR: ${String(payload.heart_rate).padStart(3)} bpm  SpO2: ${payload.spo2.toFixed(1).padStart(5)}%  ${statusColor}${payload.status.padEnd(8)}${reset}  ${codeStr}`
  );
}

async function main() {
  console.log('='.repeat(70));
  console.log('  Smart Patient Monitor — Node.js Data Simulator');
  console.log(`  Posting to: ${BACKEND_URL}`);
  console.log(`  Interval  : ${INTERVAL_SEC}s`);
  console.log('  Press Ctrl+C to stop');
  console.log('='.repeat(70));

  let step = 0;
  let scenarioIdx = 0;
  let scenarioStep = 0;

  setInterval(async () => {
    const scenario = SCENARIOS[scenarioIdx];
    const payload = simulateReading(step, scenario);
    const code = await sendReading(payload);
    printRow(scenario.name, payload, code);

    step++;
    scenarioStep++;

    const readingsInScenario = Math.floor(scenario.duration / INTERVAL_SEC);
    if (scenarioStep >= readingsInScenario) {
      scenarioStep = 0;
      scenarioIdx = (scenarioIdx + 1) % SCENARIOS.length;
      console.log(`\n[SIM] ── Switching to: ${SCENARIOS[scenarioIdx].name} ──\n`);
    }
  }, INTERVAL_SEC * 1000);
}

main();

