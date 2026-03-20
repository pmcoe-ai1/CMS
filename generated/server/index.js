// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// ────────────────────────────────────────────────────────────
// Server module index
// ────────────────────────────────────────────────────────────

const { createApp } = require('./app');
const { getPrismaClient, disconnectPrisma } = require('./prisma-client');
const { register } = require('./metrics');

module.exports = { createApp, getPrismaClient, disconnectPrisma, register };
