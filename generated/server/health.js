// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// ────────────────────────────────────────────────────────────
// Health check endpoint
// ────────────────────────────────────────────────────────────

const { getPrismaClient } = require('./prisma-client');

const DOMAIN = "cms";
const VERSION = "1.0.0";

async function healthCheck(req, res) {
  let dbStatus = 'unknown';
  try {
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } else {
      dbStatus = 'unavailable';
    }
  } catch (err) {
    dbStatus = 'error';
  }

  const status = dbStatus === 'connected' || dbStatus === 'unavailable' ? 'healthy' : 'degraded';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status: status,
    version: VERSION,
    domain: DOMAIN,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { healthCheck };
