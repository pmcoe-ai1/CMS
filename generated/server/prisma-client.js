// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// ────────────────────────────────────────────────────────────
// Prisma client singleton
// ────────────────────────────────────────────────────────────

let prismaClient = null;

function getPrismaClient() {
  if (!prismaClient) {
    try {
      const { PrismaClient } = require('@prisma/client');
      prismaClient = new PrismaClient();
    } catch (err) {
      console.warn('Prisma client not available:', err.message);
      prismaClient = null;
    }
  }
  return prismaClient;
}

async function disconnectPrisma() {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}

module.exports = { getPrismaClient, disconnectPrisma };
