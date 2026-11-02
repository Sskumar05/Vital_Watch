// =============================================================
//  AI-Driven IoT Smart Patient Monitor — Express Backend
//  File: server.js
//  Migrated from Flask (app.py) to Express.js / Node.js
// =============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const vitalsRoutes = require('./routes/vitalsRoutes');
const vitalsController = require('./controllers/vitalsController');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Enable CORS for all incoming cross-origin dashboard requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check endpoint
app.get('/health', vitalsController.getHealth);

// API Routes
app.use('/api', vitalsRoutes);

// Root fallback / info
app.get('/', (req, res) => {
  res.json({
    service: 'Smart Patient Monitor API (MERN)',
    status: 'running',
    endpoints: [
      'POST /api/vitals',
      'GET  /api/vitals/latest',
      'GET  /api/vitals/history?range=1h|24h',
      'GET  /api/alerts',
      'GET  /health',
    ],
  });
});

// Central error handler
app.use(errorHandler);

// Start Server and Connect Database
const startServer = async () => {
  await connectDB();

  app.listen(PORT, HOST, () => {
    console.log(`[SERVER] Express backend running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`[SERVER] Ready to receive NodeMCU telemetry and serve React dashboard`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

