// =============================================================
//  Vitals Routes
//  Preserves exact Flask API paths and HTTP methods:
//  - POST /api/vitals
//  - GET  /api/vitals/latest
//  - GET  /api/vitals/history
//  - GET  /api/alerts
// =============================================================

const express = require('express');
const router = express.Router();
const vitalsController = require('../controllers/vitalsController');
const { validateVitalsPayload } = require('../middleware/validator');

// Hardware & Simulator Telemetry ingestion
router.post('/vitals', validateVitalsPayload, vitalsController.postVitals);

// Dashboard Polling endpoints
router.get('/vitals/latest', vitalsController.getLatest);
router.get('/vitals/history', vitalsController.getHistory);
router.get('/alerts', vitalsController.getAlerts);

module.exports = router;

