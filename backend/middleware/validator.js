// =============================================================
//  Validation Middleware
//  Strictly replicates Python Flask validate_payload rules
// =============================================================

function validateVitalsPayload(req, res, next) {
  const data = req.body;

  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const required = ['timestamp', 'heart_rate', 'spo2', 'status'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      return res.status(422).json({ error: `Missing field: ${field}` });
    }
  }

  const heartRate = Number(data.heart_rate);
  const spo2 = Number(data.spo2);

  if (typeof data.heart_rate !== 'number' || isNaN(heartRate)) {
    return res.status(422).json({ error: 'heart_rate must be numeric' });
  }

  if (typeof data.spo2 !== 'number' || isNaN(spo2)) {
    return res.status(422).json({ error: 'spo2 must be numeric' });
  }

  if (data.status !== 'NORMAL' && data.status !== 'CRITICAL') {
    return res.status(422).json({ error: 'status must be NORMAL or CRITICAL' });
  }

  if (heartRate < 0 || heartRate > 300) {
    return res.status(422).json({ error: 'heart_rate out of physiological range' });
  }

  if (spo2 < 0 || spo2 > 100) {
    return res.status(422).json({ error: 'spo2 out of range' });
  }

  // Normalize numbers on req.body
  req.body.heart_rate = Math.round(heartRate);
  req.body.spo2 = parseFloat(spo2.toFixed(1));

  next();
}

module.exports = {
  validateVitalsPayload,
};

