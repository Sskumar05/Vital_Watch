// =============================================================
//  API Endpoint Test Suite for Express Backend
//  Validates complete API compatibility with Python Flask
// =============================================================

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('./server');
const { runMigration } = require('../database-migration/migrateSQLiteToMongoDB');

let server;
let mongod;
let BASE_URL;

async function setup() {
  mongod = await MongoMemoryServer.create({
    instance: { dbName: 'test_api_vitals' }
  });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);

  // Seed with SQLite migration data so queries have full real data
  await runMigration(uri);
  await mongoose.connect(uri); // Re-ensure connection

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      BASE_URL = `http://127.0.0.1:${port}`;
      console.log(`[TEST] Test server started on ${BASE_URL}`);
      resolve();
    });
  });
}

async function teardown() {
  if (server) await new Promise(r => server.close(r));
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
  console.log('[TEST] Test server and MongoDB stopped.');
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('  EXPRESS BACKEND API COMPATIBILITY TESTS');
  console.log('='.repeat(70));

  await setup();

  let passed = 0;
  let failed = 0;

  async function assert(desc, fn) {
    try {
      await fn();
      console.log(`[PASS] ${desc}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${desc} - ${err.message}`);
      failed++;
    }
  }

  // Test 1: GET /health
  await assert('GET /health returns 200 with status ok and ISO timestamp', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok' || !data.time) throw new Error(`Invalid response: ${JSON.stringify(data)}`);
  });

  // Test 2: GET /api/vitals/latest
  await assert('GET /api/vitals/latest returns latest vital reading matching SQLite ID 524', async () => {
    const res = await fetch(`${BASE_URL}/api/vitals/latest`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.id !== 524) throw new Error(`Expected ID 524, got ${data.id}`);
    if (data.heart_rate !== 91 || Math.abs(data.spo2 - 97.6) > 0.01) {
      throw new Error(`Data mismatch: HR ${data.heart_rate}, SpO2 ${data.spo2}`);
    }
  });

  // Test 3: GET /api/alerts
  await assert('GET /api/alerts returns list of CRITICAL events with descending IDs', async () => {
    const res = await fetch(`${BASE_URL}/api/alerts`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length !== 190) {
      throw new Error(`Expected 190 critical alerts, got ${data.length}`);
    }
    if (data.some(d => d.status !== 'CRITICAL')) {
      throw new Error('Non-critical status found in alerts endpoint');
    }
    if (data[0].id < data[1].id) {
      throw new Error('Alerts not sorted descending');
    }
  });

  // Test 4: POST /api/vitals (validation - empty body)
  await assert('POST /api/vitals rejects empty JSON body with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 5: POST /api/vitals (validation - missing fields)
  await assert('POST /api/vitals rejects missing required fields with 422', async () => {
    const res = await fetch(`${BASE_URL}/api/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: '2026-11-02 18:00:00', heart_rate: 75 }),
    });
    if (res.status !== 422) throw new Error(`Expected 422, got ${res.status}`);
    const data = await res.json();
    if (!data.error.includes('Missing field')) throw new Error(`Unexpected error message: ${data.error}`);
  });

  // Test 6: POST /api/vitals (validation - physiological range)
  await assert('POST /api/vitals rejects physiological out-of-range HR with 422', async () => {
    const res = await fetch(`${BASE_URL}/api/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: '2026-11-02 18:00:00',
        heart_rate: 450,
        spo2: 98.0,
        status: 'NORMAL'
      }),
    });
    if (res.status !== 422) throw new Error(`Expected 422, got ${res.status}`);
  });

  // Test 7: POST /api/vitals (success)
  await assert('POST /api/vitals ingests valid telemetry packet and returns 201 OK', async () => {
    const res = await fetch(`${BASE_URL}/api/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: '2026-11-02 18:45:00',
        heart_rate: 82,
        spo2: 97.8,
        status: 'NORMAL'
      }),
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    if (data.message !== 'OK') throw new Error(`Unexpected message: ${data.message}`);

    // Verify it is now latest
    const latestRes = await fetch(`${BASE_URL}/api/vitals/latest`);
    const latestData = await latestRes.json();
    if (latestData.id !== 525) throw new Error(`Expected ID 525, got ${latestData.id}`);
    if (latestData.heart_rate !== 82) throw new Error(`Expected HR 82, got ${latestData.heart_rate}`);
  });

  // Test 8: GET /api/vitals/history
  await assert('GET /api/vitals/history?range=24h returns 200 array', async () => {
    const res = await fetch(`${BASE_URL}/api/vitals/history?range=24h`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('History is not an array');
  });

  await teardown();

  console.log('='.repeat(70));
  console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(70));

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('[UNCAUGHT TEST EXCEPTION]', err);
  process.exit(1);
});

