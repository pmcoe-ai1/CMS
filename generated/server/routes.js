// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// ────────────────────────────────────────────────────────────
// Routes — one per canonical model operation
// ────────────────────────────────────────────────────────────

const express = require('express');
const path = require('path');

const router = express.Router();

/**
 * Try to load a rule implementation from src/rules/ (dev) or dist/rules/ (prod).
 * Returns null if not found.
 */
function loadRule(ruleId) {
  const camelName = ruleId.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
  const paths = [
    path.resolve(__dirname, '../../dist/rules/' + ruleId),
    path.resolve(__dirname, '../../dist/rules/' + camelName),
    path.resolve(__dirname, '../../src/rules/' + ruleId),
    path.resolve(__dirname, '../../src/rules/' + camelName),
  ];
  for (const p of paths) {
    try {
      return require(p);
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') throw e;
    }
  }
  return null;
}

// Operation: create-task
router.post("/tasks", async function createTask(req, res, next) {
  try {
    const input = req.body;

    res.status(201).json({ message: 'OK', operation: "create-task" });
  } catch (err) {
    next(err);
  }
});

// Operation: list-tasks
router.get("/tasks", async function listTasks(req, res, next) {
  try {

    res.status(200).json({ message: 'OK', operation: "list-tasks" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
