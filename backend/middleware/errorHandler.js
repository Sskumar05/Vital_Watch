// =============================================================
//  Central Error Handling Middleware
// =============================================================

function errorHandler(err, req, res, next) {
  // If JSON parsing error from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  console.error(`[Server Error] ${err.stack || err.message}`);
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

module.exports = errorHandler;

