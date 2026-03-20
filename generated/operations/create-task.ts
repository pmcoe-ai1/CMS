// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

// operation:    create-task
// method:       POST /tasks
// intentRef:    manage-tasks
// ruleRefs:     []
// scenarioRefs: []
//
// IMPLEMENT THIS STUB in: src/operations/create-task.ts
// Do not modify this file. Changes here will be overwritten by codegen.

import type { Task } from '../interfaces/Task';

export type CreateTaskRequest = {
  body: Task;
};

export type CreateTaskFn = (request: CreateTaskRequest) => Task;
