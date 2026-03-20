// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

// intentRef: manage-tasks
// canonicalModelVersion: 1.0.0
// entityRef: task

import type { TaskStatus } from './enums';

export interface Task {
  readonly id: string; // uuid, immutable, system
  title: string; // string, validation: {maxLength:255}
  description: string | null; // string, nullable
  status: TaskStatus; // enum
  readonly createdAt: Date; // datetime, immutable, system
  readonly updatedAt: Date; // datetime, system
}

// Input type for creating a Task (excludes system fields; immutable non-system fields are required)
export interface CreateTaskInput {
  title: string;
  description?: string | null;
  // status omitted — set by lifecycle initialState on creation
  // use transitionTaskStatus() for all subsequent state changes
}

// Input type for updating a Task (only mutable, non-system fields)
// Note: status changes must use transitionTaskStatus(), not this type directly.
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
}

// Error class for invalid lifecycle transitions
export class InvalidLifecycleTransition extends Error {
  constructor(public readonly from: TaskStatus, public readonly to: TaskStatus) {
    super(`Invalid lifecycle transition: ${from} → ${to}`);
    this.name = 'InvalidLifecycleTransition';
  }
}

// Lifecycle transition function — enforces valid state transitions
// entityRef: task
export function transitionTaskStatus(
  entity: Task,
  to: TaskStatus
): Task {
  const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    'pending': ['in-progress'],
    'in-progress': ['done', 'pending'],
    'done': [], // terminal
  };
  const allowed = validTransitions[entity.status];
  if (!allowed || !allowed.includes(to)) {
    throw new InvalidLifecycleTransition(entity.status, to);
  }
  return { ...entity, status: to };
}
