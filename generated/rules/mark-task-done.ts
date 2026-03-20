// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

// intentRef: manage-tasks
// canonicalModelVersion: 1.0.0
// entityRef: task
// scenarioRefs: [task-marked-done, task-not-already-done]
//
// Canonical condition:
//   status eq "in-progress"
//
// Canonical action:
//   set status = "done"
//     emit-event task.completed
//
// IMPLEMENT THIS STUB in: src/rules/mark-task-done.ts
// Do not modify this file. Changes here will be overwritten by codegen.

import type { Task } from '../interfaces/Task';

export type MarkTaskDoneFn = (task: Task) => Task;

// The implementation must satisfy these scenarios:
// ✓ task-marked-done                         — status=in-progress
// ✓ task-not-already-done                    — status=done
