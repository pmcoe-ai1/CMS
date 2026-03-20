// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// ────────────────────────────────────────────────────────────
// Prometheus metrics
// ────────────────────────────────────────────────────────────

const client = require('prom-client');

const register = new client.Registry();
register.setDefaultLabels({ domain: "cms" });
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'fabric_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});
register.registerMetric(httpRequestDuration);

const httpRequestsTotal = new client.Counter({
  name: 'fabric_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});
register.registerMetric(httpRequestsTotal);

const operationErrorsTotal = new client.Counter({
  name: 'fabric_operation_errors_total',
  help: 'Total number of operation errors',
  labelNames: ['operation', 'error_code'],
});
register.registerMetric(operationErrorsTotal);

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', function () {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;
    const labels = { method: req.method, path: req.route ? req.route.path : req.path, status: res.statusCode };
    httpRequestDuration.observe(labels, durationSec);
    httpRequestsTotal.inc(labels);
  });
  next();
}

module.exports = { register, metricsMiddleware, httpRequestDuration, httpRequestsTotal, operationErrorsTotal };
