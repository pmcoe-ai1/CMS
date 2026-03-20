// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// ────────────────────────────────────────────────────────────
// Error handler — maps canonical error codes to HTTP status
// ────────────────────────────────────────────────────────────

const ERROR_CODE_MAP = {
  'VALIDATION_ERROR': 400,
};

function errorHandler(err, req, res, _next) {
  const code = err.code || err.errorCode;
  const status = (code && ERROR_CODE_MAP[code]) || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({
    error: {
      code: code || 'INTERNAL_ERROR',
      message: message,
    },
  });
}

module.exports = { errorHandler, ERROR_CODE_MAP };
