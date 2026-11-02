// =============================================================
//  Vitals Service Layer
//  Encapsulates MongoDB queries matching the SQLite operations
// =============================================================

const Vital = require('../models/Vital');

class VitalsService {
  /**
   * Insert a new vital reading
   */
  async createVital({ timestamp, heart_rate, spo2, status }) {
    const highest = await Vital.findOne().sort({ id: -1 }).select('id').lean();
    const nextId = highest && typeof highest.id === 'number' ? highest.id + 1 : 1;

    const now = new Date();
    const createdAtStr = now.toISOString().replace('T', ' ').slice(0, 19);

    const vital = new Vital({
      id: nextId,
      timestamp,
      heart_rate,
      spo2,
      status,
      created_at: createdAtStr,
    });

    await vital.save();
    return vital;
  }

  /**
   * Get the single latest reading
   */
  async getLatestVital() {
    return await Vital.findOne().sort({ id: -1 }).lean();
  }

  /**
   * Get historical readings based on 1h or 24h range
   */
  async getHistory(rangeParam = '1h') {
    const hours = rangeParam === '24h' ? 24 : 1;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const cutoffStr = cutoff.toISOString().replace('T', ' ').slice(0, 19);

    return await Vital.find({ created_at: { $gte: cutoffStr } })
      .sort({ id: 1 })
      .lean();
  }

  /**
   * Get all CRITICAL alerts sorted descending
   */
  async getAlerts() {
    return await Vital.find({ status: 'CRITICAL' })
      .sort({ id: -1 })
      .lean();
  }
}

module.exports = new VitalsService();

