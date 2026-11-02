// =============================================================
//  Automated End-to-End Migration Test using MongoMemoryServer
//  Verifies 100% data fidelity without requiring external mongod daemon
// =============================================================

const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require(path.resolve(__dirname, '../backend/node_modules/mongodb-memory-server'));
const { runMigration, readSQLiteData } = require('./migrateSQLiteToMongoDB');
const { verify } = require('./verifyMigration');

async function testFullMigrationPipeline() {
  console.log('='.repeat(70));
  console.log('  STARTING MIGRATION PIPELINE TEST');
  console.log('='.repeat(70));

  console.log('[TEST] Starting In-Memory MongoDB Server...');
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'patient_monitor_test' }
  });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  console.log(`[TEST] In-Memory MongoDB running at: ${uri}`);

  // Test 1: Run First Migration
  console.log('\n--- TEST PASS 1: Initial Migration ---');
  await runMigration(uri);

  // Test 2: Verify Data Accuracy
  console.log('\n--- TEST PASS 2: Deep Verification ---');
  await verify(uri);

  // Test 3: Idempotency & Duplicate Prevention
  console.log('\n--- TEST PASS 3: Idempotency Check (Rerunning Migration) ---');
  await runMigration(uri);

  // Check count after rerun
  await mongoose.connect(uri);
  const Vital = mongoose.models.Vital;
  const countAfterRerun = await Vital.countDocuments();
  console.log(`[TEST] Count after rerun: ${countAfterRerun} (Expected: 524)`);

  if (countAfterRerun === 524) {
    console.log('[✓] Idempotency confirmed: No duplicate records created on second run.');
  } else {
    throw new Error(`Duplicate records detected! Expected 524 but got ${countAfterRerun}`);
  }

  await mongoose.disconnect();
  await mongod.stop();

  console.log('\n' + '='.repeat(70));
  console.log('  ALL MIGRATION PIPELINE TESTS PASSED WITH 100% FIDELITY!');
  console.log('='.repeat(70));
}

testFullMigrationPipeline().catch(err => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
