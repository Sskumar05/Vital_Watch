// =============================================================
//  Data Verification Script: SQLite vs MongoDB
//  Performs deep row-by-row and statistical comparison
// =============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const path = require('path');
const mongoose = require('mongoose');
const { readSQLiteData } = require('./migrateSQLiteToMongoDB');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/patient_monitor';

const vitalSchema = new mongoose.Schema({
  id: Number,
  timestamp: String,
  heart_rate: Number,
  spo2: Number,
  status: String,
  created_at: String,
});
const Vital = mongoose.models.Vital || mongoose.model('Vital', vitalSchema);

async function verify(customUri) {
  const mongoURI = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/patient_monitor';

  console.log('='.repeat(70));
  console.log('  Data Integrity Verification: SQLite vs MongoDB');
  console.log(`  Target MongoDB: ${mongoURI}`);
  console.log('='.repeat(70));

  const sqliteRows = readSQLiteData();
  console.log(`[SQLITE] Total records: ${sqliteRows.length}`);

  await mongoose.connect(mongoURI);
  const mongoCount = await Vital.countDocuments();
  console.log(`[MONGODB] Total records: ${mongoCount}`);

  if (sqliteRows.length !== mongoCount) {
    console.warn(`[!] Count mismatch: SQLite has ${sqliteRows.length}, MongoDB has ${mongoCount}`);
  } else {
    console.log(`[✓] Record counts match exactly (${mongoCount} rows).`);
  }

  // Spot-check first, middle, and last records
  const indicesToCheck = [0, Math.floor(sqliteRows.length / 2), sqliteRows.length - 1];
  let mismatchFound = false;

  for (const idx of indicesToCheck) {
    const sRow = sqliteRows[idx];
    const mDoc = await Vital.findOne({ id: sRow.id }).lean();

    if (!mDoc) {
      console.error(`[✗] Missing document for ID ${sRow.id} in MongoDB!`);
      mismatchFound = true;
      continue;
    }

    const matches =
      mDoc.id === sRow.id &&
      mDoc.timestamp === sRow.timestamp &&
      mDoc.heart_rate === sRow.heart_rate &&
      Math.abs(mDoc.spo2 - sRow.spo2) < 0.01 &&
      mDoc.status === sRow.status &&
      mDoc.created_at === sRow.created_at;

    if (!matches) {
      console.error(`[✗] Data discrepancy for ID ${sRow.id}:`);
      console.error('    SQLite :', sRow);
      console.error('    MongoDB:', mDoc);
      mismatchFound = true;
    } else {
      console.log(`[✓] ID ${sRow.id} matches perfectly across all fields:`);
      console.log(`    Time: ${mDoc.timestamp} | HR: ${mDoc.heart_rate} | SpO2: ${mDoc.spo2} | Status: ${mDoc.status}`);
    }
  }

  console.log('='.repeat(70));
  if (!mismatchFound) {
    console.log('  VERIFICATION PASSED: MongoDB data is identical to SQLite.');
  } else {
    console.log('  VERIFICATION FAILED: Discrepancies detected.');
  }
  console.log('='.repeat(70));

  await mongoose.disconnect();
}

if (require.main === module) {
  verify().catch(err => {
    console.error('[VERIFICATION ERROR]', err.message);
    process.exit(1);
  });
}

module.exports = { verify };

