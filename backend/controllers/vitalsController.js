// =============================================================
//  Vitals Controller
//  Preserves exact Flask HTTP status codes and JSON formats
// =============================================================

const vitalsService = require('../services/vitalsService');

/**
 * Format document for JSON response (removes _id and __v)
 */
function formatRecord(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    timestamp: doc.timestamp,
    heart_rate: doc.heart_rate,
    spo2: doc.spo2,
    status: doc.status,
    created_at: doc.created_at,
  };
}

/**
 * POST /api/vitals
 * Receive telemetry reading from NodeMCU or Simulator
 */
async function postVitals(req, res, next) {
  try {
    const { timestamp, heart_rate, spo2, status } = req.body;
    await vitalsService.createVital({ timestamp, heart_rate, spo2, status });
    return res.status(201).json({ message: 'OK' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/vitals/latest
 * Return the most recent vital reading
 */
async function getLatest(req, res, next) {
  try {
    const latest = await vitalsService.getLatestVital();
    if (!latest) {
      return res.status(204).json({ message: 'No data yet' });
    }
    return res.status(200).json(formatRecord(latest));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/vitals/history?range=1h|24h
 * Return historical vital readings
 */
async function getHistory(req, res, next) {
  try {
    const rangeParam = req.query.range || '1h';
    const rows = await vitalsService.getHistory(rangeParam);
    return res.status(200).json(rows.map(formatRecord));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/alerts
 * Return all CRITICAL vital events
 */
async function getAlerts(req, res, next) {
  try {
    const alerts = await vitalsService.getAlerts();
    return res.status(200).json(alerts.map(formatRecord));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /health
 * Health check endpoint
 */
function getHealth(req, res) {
  return res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
  });
}

module.exports = {
  postVitals,
  getLatest,
  getHistory,
  getAlerts,
  getHealth,
};

