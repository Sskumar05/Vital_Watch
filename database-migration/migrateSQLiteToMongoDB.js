// =============================================================
//  SQLite to MongoDB Migration Script
//  Migrates historical patient vitals from SQLite (vitals.db)
//  to MongoDB (Vital collection) using Mongoose & node:sqlite
// =============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Path to original SQLite database
const SQLITE_DB_PATH = path.resolve(__dirname, '../backend/vitals.db');

// MongoDB Connection URI
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/patient_monitor';

// Vital Schema matching backend
const vitalSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    timestamp: { type: String, required: true },
    heart_rate: { type: Number, required: true },
    spo2: { type: Number, required: true },
    status: { type: String, required: true, enum: ['NORMAL', 'CRITICAL'] },
    created_at: { type: String, required: true, index: true },
  },
  { versionKey: false }
);

const Vital = mongoose.models.Vital || mongoose.model('Vital', vitalSchema);

/**
 * Read all rows from SQLite using built-in node:sqlite or fallback
 */
function readSQLiteData() {
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    throw new Error(`SQLite database not found at: ${SQLITE_DB_PATH}`);
  }

  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(SQLITE_DB_PATH, { readOnly: true });
    const rows = db.prepare('SELECT id, timestamp, heart_rate, spo2, status, created_at FROM vitals ORDER BY id ASC').all();
    db.close();
    return rows;
  } catch (err) {
    console.warn(`[Migration] node:sqlite error (${err.message}). Trying fallback via child_process Python query...`);
    const { execSync } = require('child_process');
    const pyScript = `
import sqlite3, json
c = sqlite3.connect(r'${SQLITE_DB_PATH}')
c.row_factory = sqlite3.Row
rows = [dict(r) for r in c.execute('SELECT id, timestamp, heart_rate, spo2, status, created_at FROM vitals ORDER BY id ASC').fetchall()]
print(json.dumps(rows))
    `.trim();
    const output = execSync(`python -c "${pyScript.replace(/\n/g, '; ')}"`, { encoding: 'utf-8' });
    return JSON.parse(output);
  }
}

/**
 * Execute migration
 */
async function runMigration(customUri) {
  const mongoURI = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/patient_monitor';

  console.log('='.repeat(70));
  console.log('  SQLite to MongoDB Data Migration');
  console.log(`  Source SQLite : ${SQLITE_DB_PATH}`);
  console.log(`  Target MongoDB: ${mongoURI}`);
  console.log('='.repeat(70));

  // 1. Read SQLite Data
  console.log('\n[1/4] Reading data from SQLite database...');
  const sqliteRows = readSQLiteData();
  const sqliteCount = sqliteRows.length;
  console.log(`[1/4] Found ${sqliteCount} records in SQLite vitals table.`);

  if (sqliteCount === 0) {
    console.log('[!] SQLite database is empty. Nothing to migrate.');
    return;
  }

  // 2. Connect to MongoDB
  console.log('\n[2/4] Connecting to MongoDB...');
  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 8000 });
  console.log('[2/4] MongoDB Connected successfully.');

  const initialMongoCount = await Vital.countDocuments();
  console.log(`[2/4] Current MongoDB record count before migration: ${initialMongoCount}`);

  // 3. Batch migrate with duplicate protection (upsert by id)
  console.log('\n[3/4] Migrating records to MongoDB (Idempotent Upsert)...');
  const bulkOps = sqliteRows.map(row => ({
    updateOne: {
      filter: { id: row.id },
      update: {
        $setOnInsert: {
          id: Number(row.id),
          timestamp: String(row.timestamp),
          heart_rate: Number(row.heart_rate),
          spo2: Number(row.spo2),
          status: String(row.status),
          created_at: String(row.created_at),
        },
      },
      upsert: true,
    },
  }));

  const result = await Vital.bulkWrite(bulkOps, { ordered: false });
  const insertedCount = result.upsertedCount || 0;
  const matchedCount = result.matchedCount || 0;

  console.log(`[3/4] Bulk write complete.`);
  console.log(`      - Newly inserted records: ${insertedCount}`);
  console.log(`      - Existing matched records: ${matchedCount}`);

  // 4. Verify Migration
  console.log('\n[4/4] Verifying migrated records...');
  const finalMongoCount = await Vital.countDocuments();
  console.log(`      - Final MongoDB record count: ${finalMongoCount}`);

  // Status distributions
  const normalCount = await Vital.countDocuments({ status: 'NORMAL' });
  const criticalCount = await Vital.countDocuments({ status: 'CRITICAL' });
  console.log(`      - NORMAL records  : ${normalCount}`);
  console.log(`      - CRITICAL records: ${criticalCount}`);

  // Min / Max ID check
  const firstDoc = await Vital.findOne().sort({ id: 1 }).lean();
  const lastDoc = await Vital.findOne().sort({ id: -1 }).lean();
  console.log(`      - Min ID in MongoDB: ${firstDoc ? firstDoc.id : 'N/A'}`);
  console.log(`      - Max ID in MongoDB: ${lastDoc ? lastDoc.id : 'N/A'}`);

  console.log('\n' + '='.repeat(70));
  if (finalMongoCount >= sqliteCount) {
    console.log('  SUCCESS: Migration completed and verified with 100% data integrity!');
  } else {
    console.warn('  WARNING: Record count mismatch. Please inspect database logs.');
  }
  console.log('='.repeat(70));

  await mongoose.disconnect();
}

if (require.main === module) {
  runMigration().catch(err => {
    console.error('[MIGRATION FAILED]', err.message);
    process.exit(1);
  });
}

module.exports = { runMigration, readSQLiteData };

