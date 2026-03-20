// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// ────────────────────────────────────────────────────────────
// Express application factory
// ────────────────────────────────────────────────────────────

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const { healthCheck } = require('./health');
const { errorHandler } = require('./error-handler');
const { metricsMiddleware } = require('./metrics');

function createApp() {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors());

  // Body parsing
  app.use(express.json());

  // Metrics
  app.use(metricsMiddleware);

  // Health check
  app.get('/health', healthCheck);

  // API routes
  app.use(routes);

  // Error handler (must be last)
  app.use(errorHandler);

  // Serve generated frontend (static files)
  const frontendPath = require('path').join(__dirname, '..', 'frontend');
  const fs = require('fs');
  if (fs.existsSync(frontendPath)) {
    app.use(require('express').static(frontendPath));
    // SPA fallback: non-API routes serve index.html
    app.get('*', function (req, res, next) {
      if (req.path.startsWith('/orders') || req.path.startsWith('/loyalty') || req.path.startsWith('/customers') || req.path.startsWith('/health') || req.path.startsWith('/metrics')) return next();
      res.sendFile(require('path').join(frontendPath, 'index.html'));
    });
  }

  return app;
}

module.exports = { createApp };
